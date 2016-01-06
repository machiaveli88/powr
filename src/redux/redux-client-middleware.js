export default function clientMiddleware(client) {
   return ({ dispatch, getState }) => {
      return (next) => (action) => {
         if(!action){
            return;
         }

         if(typeof action === 'function'){
            return action(dispatch, getState, client);
         }

         const { promise, types, ...rest } = action;
         if (!promise) {
            return next(action);
         }

         const [REQUEST, SUCCESS, FAILURE] = types;

         next({...rest, type: REQUEST});
         return promise(client).then(
            (result) => next({...rest, result, type: SUCCESS}),
            (error) => next({...rest, error, type: FAILURE})
         ).catch((err)=>{
            console.error(err);
            next({...rest, error: err, type: FAILURE});
         });
      };
   };
}
