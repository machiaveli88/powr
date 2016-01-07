require("babel-core/polyfill");

import React, {PropTypes, Component} from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ApiClient, RouteHookHandler, ReduxClientMiddleware} from './redux';
import {createStore, bindActionCreators, compose, combineReducers, applyMiddleware} from 'redux';
var DragDropContext = require('react-dnd').DragDropContext;
var HTML5Backend = require('react-dnd-html5-backend');

import { syncReduxAndRouter, routeReducer, pushPath} from 'redux-simple-router'
import { Router, Route, browserHistory, hashHistory} from 'react-router'

var devTools = require('powr-devtools');

export default function (app) {
   var isElectron = typeof ELECTRON === 'object';
   app.history = isElectron ? hashHistory : browserHistory;
   app.apiClient = new ApiClient();

   app.actions = app.reducers = {};
   for (var key in app.redux) {
      app.reducers[key] = app.redux[key].reducer;
   }

   const isomorphic = window.__data ? true : false;

   const reducer = combineReducers({
      ...app.reducers,
      routing: routeReducer
   });

   var DevTools = devTools();

   app.store = DevTools ? compose(
      applyMiddleware(ReduxClientMiddleware(app.apiClient)),
      DevTools.instrument()
   )(createStore)(reducer, window.__data) : compose(
      applyMiddleware(ReduxClientMiddleware(app.apiClient))
   )(createStore)(reducer, window.__data);

   for (var key in app.redux) {
      app.actions[key] = bindActionCreators(app.redux[key].actions, app.store.dispatch);
   }
   app.actions.router = {
      pushPath: bindActionCreators([pushPath], app.store.dispatch)[0]
   };

   RouteHookHandler.init(app.store, app.actions, isomorphic);
   app.routes = app.routes(RouteHookHandler);

   syncReduxAndRouter(app.history, app.store)

   class Root extends Component {
      getChildContext() {
         return {
            store: app.store,
            actions: app.actions,
            local: app.local,
            apiClient: app.apiClient
         };
      }

      static childContextTypes = {
         store: PropTypes.object.isRequired,
         actions: PropTypes.object.isRequired,
         local: PropTypes.object,
         apiClient: PropTypes.object.isRequired
      };

      render() {
         if(DevTools){
            return (
               <Provider store={app.store} key="provider">
                  <div className="full">
                     <Router history={app.history}>
                        {app.routes}
                     </Router>
                     <DevTools/>
                  </div>
               </Provider>
            );
         }
         return (
            <Provider store={app.store} key="provider">
               <Router history={app.history}>
                  {app.routes}
               </Router>
            </Provider>
         );
      }
   }
   var R = DragDropContext(HTML5Backend)(Root);
   ReactDOM.render(<R />, document.getElementById('app'));
}
