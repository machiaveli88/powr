var log = require("cryo-utils/log")("server:api-token");
import jwt from "jsonwebtoken";

let key = null;

var issue = exports.issue = function(payload, minutes = 180) {
   return jwt.sign(payload, key, { expiresInMinutes : minutes });
};

var verify = exports.verify = function(token, callback) {
   return jwt.verify(token, key, {}, callback);
};

var init = exports.init = function(app, authToken){
   key = authToken;
   app.use(function(req, res, next){
      let token = null;
      if (req.body && req.body.access_token) {
         token = req.body.access_token;
      }
      else if (req.query && req.query.access_token) {
         token = req.query.access_token;
      }

      if (!token) {
         return next();
      }
      else{
         verify(token, function(err, decoded) {
            if(err){
               return next(err);
            }
            log("Auth by token", token);
            app.db.model("user").findByUsername(decoded.username, function(err, data){
               if(err){
                  next(err);
               }
               else if(!data){
                  next(new Error("No user for token, please refresh token"));
               }
               else{
                  log("Authenticated", {id: data.id, username: data.username});
                  req.user = data;
                  next()
               }
            });
         });
      }
   });
}
