module.exports =  function (app) {
   app.use(function (req, res, next) {
      req.context = req.context || {};
      if(req.query && req.query.query){
         req.context.query = req.query.query ? JSON.parse(req.query.query.split("*").join("%")) : {};
      }
      else {
         req.context.query = {};
      }
      if(!req.context.query.where){
         req.context.query.where = {};
      }
      if(!req.context.query.include){
         req.context.query.include = [];
      }
      req.context.query.include.map(function(item){
         item.model = app.db.model(item.model);
         return item;
      })
      next();
   });
}
