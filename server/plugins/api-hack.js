var extend = require("deep-extend");
import {ReplaceAll} from "cryo-utils/text";

export default function(app){
   // Inject req.query
   app.use("/api/*", function (req, res, next) {
      // ?query={"where":{"text":{"$ilike":"Test*"}}}
      if(req.query && req.query.query){
         var query = ReplaceAll(req.query.query, "\\*", "%");
         req.query = extend(req.query, JSON.parse(query));
         if(req.query.order && !Array.isArray(req.query.order)){
            req.query.order = [req.query.order];
         }
         delete req.query.query;
      }

      if(!req.query.order){
         req.query.order = '"updatedAt" DESC';
      }
      if(req.params.id || (req.query.where && (req.query.where.id || req.query.where.ref))){
         req.query.paranoid = false;
      }
      else if(req.method.toLowerCase() !== 'get'){
         req.query.paranoid = false;
      }
      next();
   });
   app.hooker.on("after bind:api", function(){
      // TODO
      app.use(function (req, res, next) {
         if(req.context.response){
            res.json(req.context.response);
         }
         else{
            next();
         }
      });
      // Handle not found
      app.use("/api/*", function(req, res, next) {
         next(new Error("No handle for " + req.originalUrl));
      });
   });
}
