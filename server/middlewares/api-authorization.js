var log = require("powr-utils/log")("server:api-cache");

var cache = {};

module.exports = function(app, config){
   app.all('*', function(req, res, next){
      if(req.query.server_token === config.serverToken){
         req.isServer = true;
      }
      next();
   });
   app.isSecure = function(req, res, next) {
      if(req.isServer){
         next();
      }
      else{
         app.isAuthenticated(req, res, next);
      }
   };
   app.isAuthenticated = function(req, res, next) {
      if(!req.user){
         var error = new Error("Auth required");
         error.status = 401;
         return next(error);
      }
      next();
   };
   app.isAdmin = [app.isAuthenticated, function(req, res, next) {
      if(!req.user.isAdmin){
         var error = new Error("Permission required");
         error.status = 401;
         return next(error);
      }
      next();
   }];
}
