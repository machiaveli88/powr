var log = require("powr-utils/log")("server:api-cache");
var Stopwatch = require("powr-utils/stopwatch");
var Url = require("url");

var cache = {};

module.exports = function(app, config){
   if(!config) {
      config = {};
   }

   // No cache if 0
   if(config.minutes === 0){
      return;
   }

   // Set 30 minutes
   if(!config.minutes) {
      config.minutes = 30;
   }

   app.before("bind:api", function(){
      log("Binding API cache", config);
      app.get("/api/v1/*", function(req, res, next) {
         var url = Url.parse(req.url).pathname;
         if (cache[url] && cache[url].stopwatch) {
            if (cache[url].stopwatch.getMinutes() > config.minutes) {
               log("Deleting cache", url);
               delete cache[url];
            }
            else {
               log("Returning cached", url, cache[url].data, cache[url].stopwatch.getMinutes(), cache[url].stopwatch.getSeconds());
               return res.json(cache[url].data);
            }
         }
         log("No cache", url, req.context.response);
         next();
      });

   });
   app.after("bind:api", function(){
      app.get("/api/v1/*", function(req, res, next) {
         var url = Url.parse(req.url).pathname;
         log("Setting cache", url, req.context.response);
         cache[url] = {
            stopwatch: new Stopwatch(),
            data: req.context.response
         }
         next();
      });
   });
}
