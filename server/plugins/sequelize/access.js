var Sequelize = require('sequelize');
var _ = require('lodash');
var shortId = require('shortid');

module.exports = function (sequelize, options) {
   if (!options) {
      options = {};
   }
   if (options.UUID === undefined) {
      options.UUID = false;
   }


   var log = options.log || console.log;

   _.extend(sequelize.Model.prototype, {
      enableApproval: function (property) {
         var Model = this;
         log('Enable approving on ' + this.name);
         this.approvable = true;
         this.addHook('afterCreate', after);
         this.addHook('afterUpdate', after);
         this.addHook('afterDelete', afterDelete);
         return this;
      }
   });

   var afterDelete = function (instance, opt) {
      var File = sequelize.model('file-usage');
      File.destroy({where: {documentId: [instance.get('id'), instance.get('ref')], model: model.name}}).catch(log);
   };

   var after = function (instance, opt) {
      var File = sequelize.model('file-usage');
      File.destroy({
         where: {
            documentId: [instance.get('id'), instance.get('ref')],
            model: opt.model.name
         }
      }).then(function () {
         var images = JSON.stringify(instance.dataValues)
            .match(/("https:\/\/res.cloudinary.com\/)(.[^"]+)(")/g);
         if(images && Array.isArray(images)){
            images = images.map(function(item){return item.substring(1, item.length-1);});
            console.log('matched', images)
            var promises = images.map(function (image) {
               File.build({
                  url: image,
                  model: opt.model.name,
                  documentId: (instance.get('ref') || instance.get('id')) + '',
               }).save();
            });
            Promise.all(promises).then(function (items) {
               log("Neue File-Usages", opt.model, "id", instance.get('id'), "count", items.length);
            }).catch(function (err) {
               log("Fehler", err);
            });
         }
      }).catch(log);
   };

   return {
      // Return defineModels()
      defineModels: function () {
         // Tag model
         var attributes = {
            userKey: { // z.B. hash der email
               primaryKey: true,
               type: Sequelize.TEXT
            },
            expiry: {
               type: Sequelize.DATE
            },
            password: {
               type: Sequelize.TEXT
            },
            publicKey: { // in der URL
               type: Sequelize.TEXT,
               defaultValue: shortId.generate,
               allowNull: false
            },
            type: { // read, read/write, create/read/write, create/read
               type: Sequelize.TEXT,
               defaultValue: 'read',
               allowNull: false
            },
            attributes: { // alle ausser: ['*', 'name', 'text'], alle: ['*'], bestimmte: ['name', 'text']
               type: Sequelize.ARRAY(Sequelize.TEXT),
               defaultValue: [],
               allowNull: false
            },
            model: {
               type: Sequelize.TEXT,
               allowNull: false
            },
            documentId: {
               type: Sequelize.NUMBER,
               allowNull: false
            }
         };
         if (options.UUID) {
            attributes.id = {
               primaryKey: true,
               type: Sequelize.UUID,
               defaultValue: Sequelize.UUIDV4
            };
            attributes.documentId.type = Sequelize.TEXT;
         }
         var Access = sequelize.define('access', attributes);

         Access.query = function () {
            return new Promise(function (resolve, reject) {
               sequelize.query('SELECT url, COUNT(*) FROM "file-usages" GROUP BY url ORDER BY COUNT(*) DESC, url;').then(function(items){
                  resolve(items[0]);
               }).catch(function (err) {
                  reject(err);
               });
            });
         }
         return Access;
      }
   }
}
