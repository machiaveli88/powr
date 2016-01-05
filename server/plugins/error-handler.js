var PrettyError = require('pretty-error');
var log = require('cryo-utils/log')("server", "error-handler");

export default function (app) {
   var pe = new PrettyError();

   app.use(function (req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
   });
   app.use(function(err, req, res, next){
      console.error('Error on', req.originalUrl);
      console.log(pe.render(err));
      if(err.errors){
         log("Errors", err.errors)
      }
      if(req.get('accept') && req.get('accept').indexOf("json") !== -1) {
         res.json({
            error: {
               message: err.message,
               stack: DEBUG && !req.isServer ? err.stack : null,
               errors: err.errors
            }
         });
      }
      else {
         res.render("error", {
            message: err.message,
            stack: DEBUG && !req.isServer ? err.stack : null,
            errors: err.errors
         });
      }
   });
   pe.skipNodeFiles(); // this will skip events.js and http.js and similar core node files
   pe.skipPackage('express');
}
