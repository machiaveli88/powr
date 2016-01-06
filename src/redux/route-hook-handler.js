var f = function(){
   var _store, _actions, _isomorphic, _initialized, _firstLocation;

   return {
      init(store, actions, isomorphic){
         if(BROWSER){
            window.addEventListener("beforeunload", function (e) {
               var keys = Object.keys(store.getState())
                  .filter(item=>store.getState()[item] && store.getState()[item].dirty === true);
               if(keys.length > 0){
                  var confirmationMessage = "Es sind noch ungespeicherte Änderungen vorhanden.";
                  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                  return confirmationMessage;                            //Webkit, Safari, Chrome
               }
               return null;
            });
         }
         _store = store;
         _actions = actions;
         _isomorphic = BROWSER && isomorphic;
         _initialized = true;
         _firstLocation = BROWSER ? window.location.pathname : null;
      },
      enter(component, clientSideOnly){
         var onEnter = component.onEnter || component.WrappedComponent.onEnter || component.WrappedComponent.WrappedComponent.onEnter;
         const hasCallback = onEnter.length > 4;

         return function(next, transition, cb){
            if(!next){ if(cb){ return cb(); } else{ return; } }

            // Enable skipping for first load if isomorphic
            if(_isomorphic){
               if(_firstLocation === next.location.pathname){
                  if(cb){ return cb(); }
                  else{ return; }
               }
               if(_firstLocation !== next.location.pathname){
                  _isomorphic = false;
               }
            }

            //console.log('ROUTES', next.routes.map(p=>p.path +':'+ p.component.displayName).join(', '));
            try{
               var promise = onEnter(next, transition, _store, _actions, cb);
               if(!hasCallback){
                  if(promise && (promise.promise || promise.then)){
                     if(BROWSER/* && (promise.force || clientSideOnly)*/){
                        promise = promise.promise || promise;
                     }
                     else if(!BROWSER && !clientSideOnly){
                        promise = promise.promise || promise;
                     }
                     else{
                        promise = null;
                     }
                  }
                  if(promise && promise.then){
                     promise.then(data=>cb(null, null))
                        .catch(err=>cb(err, null));
                  }
                  else{
                     cb(null, null);
                  }
               }
            }
            catch(err){
               if(err.message === "Cannot read property 'pathname' of null"){
                  console.error(err);
                  cb(null, null);
               }
               else{
                  //var route = next.branch[next.branch.length-1];
                  //var error = new Error(`Error during transition to ${next.location.pathname} [${route.component.displayName}]: ${err.message}`, err)
                  console.error(err);
                  cb(err, null);
               }
            }
         }
      },
      leave(component){
         var onLeave = component.onLeave || component.WrappedComponent.onLeave || component.WrappedComponent.WrappedComponent.onLeave;

         return function(){
            try{
               onLeave(_store, _actions, _store, _actions);
            }
            catch(err){
               //var route = next.routes[next.routes.length-1];
               console.error('Error during transition', err);
            }
         }
      }
   }
}();

export default f;
