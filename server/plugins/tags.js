var log = require('../log')("api", "tags");
var cache = require('./caching');
var Tags = require('../array/tags');

module.exports = function bindTags(app, model, endpoint, options){
   if(!options){
      options = {};
   }
   if(!options.cache){
      options.cache = true;
   }
   if(!options.property){
      options.property = 'tags';
   }
   log("Enable tags for", model.name)

   function getTags(cb){
      model.findAll({attributes: [options.property]}).then(function(items){
         cb(null, Tags(items, options.property));
      }).catch(function(err){cb(err)});
   }

   if(options.cache){
      app.get(endpoint, cache(model, getTags, endpoint));
   }
   else{
      app.get(endpoint, function(req, res, next) {
         getTags(function(err, items){
            if(err){
               log("Error while tags", err);
            }
            res.json(items);
         });
      });
   }
}
