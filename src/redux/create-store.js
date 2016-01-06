import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import clientMiddleware from "./redux-client-middleware.js";
import {createHistory} from 'history'; // you need to install this package

function lastAction(state = null, action = null) {
   return action;
}

export default function(client, data, reducers, routes) {
   const reducer = combineReducers({
      ...reducers,
      //router: routerStateReducer,
      lastAction
   });

   let finalCreateStore;
   if (DEBUG && BROWSER) {
      const {devTools, persistState} = require("redux-devtools");
      finalCreateStore = compose(
         //reduxReactRouter({routes, createHistory}),
         applyMiddleware(clientMiddleware(client)),
         devTools(),
         persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
      )(createStore);
   }
   else {
      const {devTools} = require("redux-devtools");
      finalCreateStore = compose(
         //reduxReactRouter({routes, createHistory}),
         applyMiddleware(clientMiddleware(client)),
         devTools()
      )(createStore);
   }
   return finalCreateStore(reducer, data || undefined);
}

