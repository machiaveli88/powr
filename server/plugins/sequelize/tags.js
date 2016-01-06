var Sequelize = require('sequelize');
var _ = require('lodash');

module.exports = function (sequelize, options) {
   if (!options) {
      options = {};
   }
   if (options.UUID === undefined) {
      options.UUID = false;
   }
   if (options.property === undefined) {
      options.property = 'tags';
   }

   var log = options.log || console.log;


   _.extend(sequelize.Model.prototype, {
      enableTags: function (property) {
         var Model = this;
         log('Enable tags on ' + this.name);
         this.taggable = {
            property: property || options.property,
            query: function () {
               return new Promise(function (resolve, reject) {
                  sequelize.query('SELECT name, COUNT(*) FROM tags WHERE model = \''+Model.name+'\' GROUP BY name ORDER BY COUNT(*) DESC, name;').then(function(items){
                     resolve(items[0]);
                  }).catch(function (err) {
                     reject(err)
                  });
               });
            }
         }

         if (!this.attributes[this.taggable.property]) {
            this.attributes[this.taggable.property] = {
               type: Sequelize.ARRAY(Sequelize.TEXT),
               defaultValue: [],
               allowNull: false
            };
         }
         this.refreshAttributes();

         var afterDelete = function (instance) {
            var Tag = sequelize.model('tag');
            Tag.destroy({where: {documentId: [instance.get('id'), instance.get('ref')], model: Model.name}}).catch(log);
         };

         var after = function (instance) {
            var Tag = sequelize.model('tag');
            Tag.destroy({
               where: {
                  documentId: [instance.get('id'), instance.get('ref')],
                  model: Model.name
               }
            }).then(function () {
               if (!instance[Model.taggable.property]) {
                  return;
               }
               var promises = instance[Model.taggable.property].map(function (tag) {
                  Tag.build({
                     name: tag,
                     model: Model.name,
                     documentId: (instance.get('ref') || instance.get('id')) + '',
                  }).save();
               });
               Promise.all(promises).then(function (items) {
                  log("Neue Tags", Model.name, "id", instance.get('id'), "count", items.length);
               }).catch(function (err) {
                  log("Fehler", err);
               });
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
            name: {
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
         var Tag = sequelize.define('tag', attributes);

         Tag.query = function () {
            return new Promise(function (resolve, reject) {
               sequelize.query('SELECT name, COUNT(*) FROM tags GROUP BY name ORDER BY COUNT(*) DESC, name;').then(function(items){
                  resolve(items[0]);
               }).catch(function (err) {
                  reject(err)
               });
            });
         }
         return Tag;
      }
   }
}
