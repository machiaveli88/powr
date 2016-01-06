var Sequelize = require('sequelize');
var _ = require('lodash');

module.exports = function (sequelize, options) {
   if (!options) {
      options = {};
   }
   if (options.UUID === undefined) {
      options.UUID = false;
   }

   var log = options.log || console.log;

   _.extend(sequelize.Model.prototype, {
      enableFileTracking: function (property) {
         var Model = this;
         log('Enable file tracking on ' + this.name);
         this.fileTrackable = true;

         var afterDelete = function (instance) {
            var File = sequelize.model('file-usage');
            File.destroy({where: {documentId: [instance.get('id'), instance.get('ref')], model: Model.name}}).catch(log);
         };

         var after = function (instance) {
            var File = sequelize.model('file-usage');
            File.destroy({
               where: {
                  documentId: [instance.get('id'), instance.get('ref')],
                  model: Model.name
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
                        model: Model.name,
                        documentId: (instance.get('ref') || instance.get('id')) + '',
                     }).save();
                  });
                  Promise.all(promises).then(function (items) {
                     log("Neue File-Usages", Model.name, "id", instance.get('id'), "count", items.length);
                  }).catch(function (err) {
                     log("Fehler", err);
                  });
               }
            }).catch(log);
         };

         this.addHook('afterCreate', after);
         this.addHook('afterUpdate', after);
         this.addHook('afterDelete', afterDelete);
         return this;
      }
   });


   return {
      // Return defineModels()
      defineModels: function () {
         // Tag model
         var attributes = {
            url: {
               primaryKey: true,
               type: Sequelize.TEXT
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
         var File = sequelize.define('file-usage', attributes);

         File.query = function () {
            return new Promise(function (resolve, reject) {
               sequelize.query('SELECT url, COUNT(*) FROM "file-usages" GROUP BY url ORDER BY COUNT(*) DESC, url;').then(function(items){
                  resolve(items[0]);
               }).catch(function (err) {
                  reject(err);
               });
            });
         }
         return File;
      }
   }
}
