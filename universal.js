import React from 'react';
import Router from 'react-router';
import {Provider} from 'react-redux';
import {reduxReactRouter, ReduxRouter} from 'redux-router';
//import {Provider} from 'cryo-utils/redux';

export default function universalRouter(app) {
   const {routes, location, history, store} = app;
   //const routes = createRoutes(store);
   return new Promise((resolve, reject) => {
      Router.run(routes, location, [/*createTransitionHook(store)*/], (error, initialState = {}, transition) => {
         if (error) {
            return reject(error);
         }

         if (transition && transition.redirectInfo) {
            return resolve({
               transition,
               isRedirect: true
            });
         }

         if (history) {  // only on client side
            initialState.history = history;
         }

         const c = (
            <ReduxRouter routes={routes} />
         );

         const component = (
            <Provider {...app} key="provider">
               {c}
            </Provider>
         );

         return resolve({
            component,
            isRedirect: false
         });
      });
   });
}
