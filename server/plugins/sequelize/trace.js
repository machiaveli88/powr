var Sequelize = require('sequelize');
var moment = require('moment');
var _ = require('lodash');

function insert(traceModel, model, instance, property, text, sub){
   var trace = traceModel.build({
      model: model.name,
      documentId: (instance.get('ref') || instance.get('id'))+'',
      weight: property.weight,
      subProperty: sub,
      name: instance.name || instance.title || instance.label || instance.description || instance.username,
      property: property.name,
      image: instance.image
         ? instance.image.url
         : instance.url
         ? instance.url
         : null,
      text: text
   });
   return trace.save();
};

var types = {
   default: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      if(!value){
         return Promise.all([]);
      }
      if(Array.isArray(value)){
         return types.array(traceModel, model, instance, property);
      }
      else if(typeof value === 'object'){
         return types.object(traceModel, model, instance, property);
      }
      else{
         return types.text(traceModel, model, instance, property);
      }
      return Promise.all([]);
   },
   date: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      if(value){
         return insert(traceModel, model, instance, property, moment(value).locale("de").format('MMMM Do YYYY, hj:mm:ss'));
      }
      return Promise.all([]);
   },
   text: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      if(value){
         return insert(traceModel, model, instance, property, value + "");
      }
      return Promise.all([]);
   },
   array: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      if(value && Array.isArray(value) && value.length > 0){
         return insert(traceModel, model, instance, property, instance.get(property.name).join(', '));
      }
      return Promise.all([]);
   },
   object: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      if(value && typeof value === 'object'){
         return insert(traceModel, model, instance, property, JSON.stringify(value));
      }
      return Promise.all([]);
   },
   blocks: function(traceModel, model, instance, property){
      var value = instance.get(property.name);
      var promises = [];
      if(value && Array.isArray(value) && value.length > 0){
         value.forEach(function(block, index){
            if(!block){
               return;
            }
            if(block.type && block.type.toLowerCase() === "title" && block.value && block.value.text){
               promises.push(insert(traceModel, model, instance, property, block.value.text.replace(/<(?:.|\n)*?>/gm, ''), (index + "")));
            }
         });
      }
      return Promise.all(promises);
   }
}

module.exports = function(sequelize, options){
   if(!options){
      options = {};
   }
   if(options.UUID === undefined){
      options.UUID = false;
   }
   if(options.types){
      for(var key in options.types){
         types[key] = options.types[key];
      }
   }
   var log = options.log || console.log;

   _.extend(sequelize.Model.prototype, {
      enableTraces: function (properties) {
         var Model = this;
         log('Enable traces on ' + Model.name);
         this.traceable = properties;

         var afterDelete = function(instance){
            var Trace = sequelize.model('trace');
            Trace.destroy({where:{ documentId: [instance.get('id'), instance.get('ref')], model: Model.name }}).catch(log);
         };

         var after = function(instance){
            var Trace = sequelize.model('trace');
            Trace.destroy({where:{ documentId: [instance.get('id'), instance.get('ref')], model: Model.name }}).then(function(){
               Object.keys(Model.traceable).forEach(function(key){
                  var property = Model.traceable[key];
                  if(typeof property !== 'object'){
                     property = { };
                  }
                  property.name = key;
                  if(!property.weight){
                     property.weight = 100;
                  }
                  if(!property.type){
                     property.type = 'default';
                  }
                  if(!types[property.type]){
                     throw new Error('Strategy "' + property.type + '" not found.');
                  }
                  types[property.type](Trace, Model, instance, property).then(function(items){
                     log("Neue Traces", Model.name, "id", instance.get('id'), "count", items.length);
                  }).catch(function(err){
                     log("Fehler", err);
                  });
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
      defineModels: function(){
         // Trace model
         var attributes = {
            model: {
               type: Sequelize.TEXT,
               allowNull: false
            },
            name: {
               type: Sequelize.TEXT
            },
            documentId: {
               type: Sequelize.NUMBER,
               allowNull: false
            },
            weight: {
               type: Sequelize.INTEGER,
               allowNull: false
            },
            property: {
               type: Sequelize.TEXT,
               allowNull: false
            },
            subProperty: {
               type: Sequelize.TEXT
            },
            text: {
               type: Sequelize.TEXT,
               allowNull: false
            },
            image: {
               type: Sequelize.TEXT
            }
         };
         if(options.UUID){
            attributes.id = {
               primaryKey: true,
               type: Sequelize.UUID,
               defaultValue: Sequelize.UUIDV4
            };
            attributes.documentId.type = Sequelize.TEXT;
         }
         var Trace = sequelize.define('trace', attributes);
         return Trace;
      }
   }
}
