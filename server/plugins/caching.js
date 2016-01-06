var log = require('../log')("api", "cache");

var cache = {};
module.exports = function cache(model, getValue, key) {
   if (Array.isArray(key)) {
      key = key.join(",");
   }
   log("Enable caching on", key);

   function update() {
      log("Caching", key);
      getValue(function (err, items) {
         if (err) {
            log("Error while caching", key, err);
         }
         log("Cached", key);
         cache[key] = items;
      });
   }

   model.hook("afterCreate", function () {
      update();
   });
   model.hook("afterDestroy", function () {
      update();
   });
   model.hook("afterUpdate", function () {
      update();
   });

   return function (req, res, next) {
      //log("Getting cached", key);
      res.json(cache[key]);
   };
}
