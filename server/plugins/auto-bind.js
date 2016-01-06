var multi = require("./multibind");
var log = require('../log')("api", "autobinder");

var autoBind = function(app, base, model, singular, plural){
   var Item = typeof model === "string" ? app.db.model(model) : model;
   var points = [base + "/" + singular];
   if(typeof model === "string"){
      points.push(base + "/" + model);
   }
   if(plural){
      points.push(base + "/" + plural);
   }
   log("AutoBind", points.join(", "));
   var singleAndPlural = multi(points);
   var base = restEndpoints(Item);

   app.get(singleAndPlural(), base.get);
   app.post(singleAndPlural(), app.isAuthenticated, base.post);
   app.get(singleAndPlural("/:id"), base.getById);
   app.put(singleAndPlural("/:id/restore"), app.isAuthenticated, base.restore);
   app.put(singleAndPlural("/:id"), app.isAuthenticated, base.put);
   app.delete(singleAndPlural("/:id"), app.isAuthenticated, base.del);
}

var restEndpoints = function(model){
   log("Rest", model);
   return{
      get: function (req, res, next) {
         req.context.findAll(model, req.query).then(function(items){
            res.json(items);
         }).catch(next);
      },
      getById: function (req, res, next) {
         var id = req.params.id;
         if(id.length === 36){
            req.context.findById(model, id, req.query).then(function(data){
               if(!data){
                  return next(new Error("Item with id " + id + " not found"));
               }
               res.json(data);
            }).catch(next);
         }
         else{
            req.query.where = {
               ref: id
            };
            req.context.findAll(model, req.query).then(function(data){
               if(!data || data.length === 0){
                  return next(new Error("Item with ref " + id + " not found"));
               }
               res.json(data[0]);
            }).catch(next);
         }
      },
      post: function (req, res, next) {
         var item = model.build(req.body);
         item.save().then(function (item) {
            res.json(item);
         }).catch(next);
      },
      put: function (req, res, next) {
         var id = req.params.id;
         req.context.findById(model, id, req.query).then(function (item) {
            if (!item) {
               return next(new Error("Item with id " + id + " not found"));
            }
            item.updateAttributes(req.body).then(function (item) {
               res.json(item);
            }).catch(next);
         }).catch(next);
      },
      del: function (req, res, next) {
         var id = req.params.id;
         req.context.findById(model, id, req.query).then(function(item){
            if(!item){
               return next(new Error("Item with id " + id + " not found"));
            }
            item.destroy().then(function(x) {
               res.json(item);
            }).catch(next);
         }).catch(next);
      },
      restore: function (req, res, next) {
         var id = req.params.id;
         req.context.findById(model, id, req.query).then(function(item){
            if(!item){
               return next(new Error("id " + id + " not found"));
            }

            item.restore().then(function(item) {
               item.updateAttributes({revision: item.revision+1}).then(function(item) {
                  res.json(item);
               }).catch(next);
            }).catch(next);
         }).catch(next);
      }
   }
}

module.exports =  {
   autoBind: autoBind,
   rest: restEndpoints
}
