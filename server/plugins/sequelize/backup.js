var path = require('path');
var fs = require('fs');
var sort = require('lodash.sortby');
var log = require('../log')("sequelize", "porter");
var mkdirp = require('mkdirp');
var moment = require('moment');
var JSONStream = require('JSONStream');
var es = require('event-stream');

function getDirectories(srcpath) {
   return fs.readdirSync(srcpath).filter(function(file) {
      return fs.statSync(path.join(srcpath, file)).isDirectory();
   });
}

var porter = module.exports = {
   backup: function(sequelize, options){
      return new Promise(function(resolve, reject){
         var folders = sort(getDirectories(options.output));
         var packageJson = require(path.resolve('..', '..', '..', '..', 'package.json'));
         var newVersion = folders.filter(function(i){return i.indexOf('v'+packageJson.version) === 0;}).length === 0;
         if(newVersion){
            log("NEW VERSION");
            var newFolder = path.resolve(options.output, 'v' + packageJson.version + '-' + moment.utc().format("YYYY.MM.DD"));
            mkdirp(newFolder, function (err) {
               if (err) {
                  console.error(err);
                  reject(err);
               }
               else{
                  porter.export(sequelize, {
                     output: newFolder,
                     include: options.include,
                     exclude: options.exclude
                  }).then(resolve).catch(reject);
               }
            });
         }
         else{
            resolve();
         }
      });
      //log(folders);
   },
   restore: function(sequelize, version, options){
      return new Promise(function(resolve, reject) {
         var folders = sort(getDirectories(options.output));

         var versions = folders.filter(function (i) {
            return i.indexOf(version) !== -1;
         });
         if (versions.length > 0) {
            var inQuestion = versions[versions.length - 1];
            log('Restoring version ' + version + ' from ' + inQuestion);

            if(options.include || options.exclude){
               porter.import(sequelize, {
                  output: path.resolve(options.output, inQuestion),
                  include: options.include,
                  exclude: options.exclude
               }).then(resolve).catch(reject);
            }
            else{
               porter.import(sequelize, {
                  output: path.resolve(options.output, inQuestion),
                  include: ['user']
               }).then(function(data){
                  porter.import(sequelize, {
                     output: path.resolve(options.output, inQuestion),
                     exclude: ['user']
                  }).then(resolve).catch(reject);
               }).catch(reject);
            }
         }
         else{
            reject("No Version " + version);
         }
      });
      //log(folders);
   },
   express: function(server, sequelize, options){
      if(!options){
         options = {};
      }
      if(!options.base){
         options.base = '/api/porter';
      }
      if(!options.output){
         options.output = path.resolve(__dirname, '_data');
      }
      mkdirp(options.output, function (err) {
         if (err) console.error(err)
      });

      log("Binding porter /ex and /im");
      server.get(options.base + '/ex', function(req, res, next){
         porter.export(sequelize, options).then(req.json).catch(next);
      });
      server.get(options.base + '/im', function(req, res, next){
         porter.import(sequelize, options).then(req.json).catch(next);
      });
   },
   exportOne: function(model, output){
      log("Exporting model " + model.name + " to " + output);
      return model.findAll({paranoid: false}).then(function(data){
         fs.writeFile(output, JSON.stringify(data, null, 4), function(err) {
            if(err) {
               console.error(err);
            } else {
               console.log("JSON saved to " + output);
            }
         });
      }).catch(function(err){
         console.error(err);
      });
   },
   export: function(sequelize, options){
      log("Exporting all");
      var promises = Object.keys(sequelize.models).map(function(key){
         if(options.exclude && options.exclude.indexOf(key) !== -1){
            return;
         }
         if(options.include && options.include.indexOf(key) === -1){
            return;
         }
         var model = sequelize.models[key];
         return porter.exportOne(model, path.resolve(options.output, model.name.toLowerCase() + '.json'));
      });
      return Promise.all(promises).then(function(){
         log("Done importing");
      });
   },
   importOne: function(model, output){
      log("Importing model " + model.name + " from " + output);
      //var promises = [];
      if(fs.existsSync(output)){
         var getStream = function () {
            var jsonData = output,
               stream = fs.createReadStream(jsonData, {encoding: 'utf8'}),
               parser = JSONStream.parse('*');
            return stream.pipe(parser);
         };

         return new Promise(function(resolve, reject){
            var stream = getStream().pipe(es.map(function (row, cb) {
               if(model.name === 'user'){
                  return new Promise(function(resolve, reject){
                     model.build(row).setPassword('asd', function(err, data){
                        if(err){
                           reject(err);
                        }
                        else{
                           data.save({hooks: false}).then(resolve).catch(reject);
                        }
                     });
                  }).then(function(data){cb(null, data)}).catch(function(err){cb(err)});
               }
               else{
                  return model.upsert(row, {hooks: false}).then(function(data){cb(null, data)}).catch(function(err){cb(err)});
               }
            }));
            stream.on('error', function(error) {
               console.error(error);
            }).on('end', function() {
               log("Done importing", model.name);
               resolve();
            });
         });
         /*return new Promise(function(resolve, reject){
          var stream = getStream().pipe(es.mapSync(function (row) {
          let item = model.build(row);
          if(model.name === 'user'){
          promises.push(Promise(function(resolve, reject){
          item.setPassword('asd', function(err, data){
          if(err){
          reject(err);
          }
          else{
          data.save({hooks: false}).then(resolve).catch(reject);
          }
          });
          }));
          }
          else{
          promises.push(item.save({hooks: false}));
          }
          }));
          stream.on('error', function(error) {
          console.log(error);
          }).on('end', function() {
          console.log('done');
          Promise.all(promises).then(function(){resolve()}).catch(function(err){reject(err)});
          });
          });*/
         /*var json = require(output);
          json.forEach(function(row){
          let item = model.build(row);
          if(model.name === 'user'){
          promises.push(new Promise(function(resolve, reject){
          item.setPassword('asd', function(err, data){
          if(err){
          reject(err);
          }
          else{
          data.save({hooks: false}).then(resolve).catch(reject);
          }
          });
          }));
          }
          else{
          promises.push(item.save({hooks: false}))
          }
          });*/
      }
      else{
         log("Could not find", output);
         return Promise.resolve();
      }
      return Promise.all(promises).then(function(){
         log("Done importing", model.name);
      });
   },
   import: function(sequelize, options){
      if(!options){
         options = {};
      }
      log("Importing all");
      var p = Promise.resolve();
      Object.keys(sequelize.models).forEach(function(key){
         if(options.exclude && options.exclude.indexOf(key) !== -1){
            return;
         }
         if(options.include && options.include.indexOf(key) === -1){
            return;
         }
         var model = sequelize.models[key];
         p = p.then(function(){
            return porter.importOne(model, path.resolve(options.output, model.name.toLowerCase() + '.json'))
         });
      });
      return p.then(function(){
         log("Done importing");
      });
   }
}
