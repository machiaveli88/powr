var AsyncEventEmitter = require('async-eventemitter');
var log = require('powr-utils/log')('utils:hook');

var app;
function hook(name, fc) {
   return function () {
      var args = arguments;
      var argsO = {
         req: args[0],
         res: args[1],
         next: args[2],
         context: {}
      };

      var self1 = this;
      app.emitBefore(name, argsO, function(err) {
         if(err){
            log('Err on hook', name, err);
         }
         var self2 = this || {};
         self2.after = function () {
            app.emitAfter('after ' + name, argsO, function(err){
               if(err){
                  log('Err on hook after', name, err);
               }
            })
         };
         fc.apply(self2, args);
         app.emit(name, args);
      });
   }
};

module.exports = function config(_app) {
   app = _app;
   var emitterBefore = new AsyncEventEmitter();
   var emitterAfter = new AsyncEventEmitter();
   app.before = emitterBefore.on;
   app.emitBefore = emitterBefore.emit;
   app.after = emitterAfter.on;
   app.emitAfter = emitterAfter.emit;
   app.hook = hook;
};
