import DocumentMeta from 'react-document-meta';

import {Provider} from 'react-redux';
import React, {PropTypes, Component} from 'react';
import path from 'path';
import ReactDOM from 'react-dom/server';
import {createStore, bindActionCreators, compose, combineReducers, applyMiddleware} from 'redux';
import {CreateStore, ApiClient, RouteHookHandler, ReduxClientMiddleware} from './redux';
import {syncReduxAndRouter, routeReducer, pushPath} from 'redux-simple-router'
import {Router, Route, match, RouterContext} from 'react-router'

var DragDropContext = require('react-dnd').DragDropContext;
var HTML5Backend = require('react-dnd-html5-backend');

export default function (_app) {
   var appPath = _app.config.entry || path.resolve(ROOT, 'app', 'app.js');
   _app.get("/**", function (req, res, next) {
      function renderOnClient(){
         res.render('default', {
            html: null,
            url: req.originalUrl
         });
      };
      // if debug -> render on client
      if (DEBUG && !_app.get('ssr')) { return renderOnClient(); }
      if(!appPath){
         console.log('config.entry not defined');
         return renderOnClient();
      }

      var app = require(appPath)();
      app.apiClient = new ApiClient(_app.config, req);

      app.actions = app.reducers = {};
      for (var key in app.redux) {
         app.reducers[key] = app.redux[key].reducer;
      }

      const reducer = combineReducers({
         ...app.reducers,
         routing: routeReducer
      });

      app.routes = app.routes(RouteHookHandler);

      app.store = compose(
         applyMiddleware(ReduxClientMiddleware(app.apiClient))
      )(createStore)(reducer);

      RouteHookHandler.init(app.store, app.actions);

      for (var key in app.redux) {
         app.actions[key] = bindActionCreators(app.redux[key].actions, app.store.dispatch);
      }
      app.actions.router = {
         pushPath: bindActionCreators([pushPath], app.store.dispatch)[0]
      };

      match({routes: app.routes, location: req.originalUrl}, (error, redirectLocation, renderProps) => {

         if (redirectLocation) {
            res.redirect(redirectLocation.pathname + redirectLocation.search);
         } else if (error) {
            next(error);
         } else if (!renderProps) {
            next();
         } else {
            var state = app.store.getState();

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
                  return (
                     <Provider store={app.store} key="provider">
                        <RouterContext {...renderProps} />
                     </Provider>
                  );
               }
            }
            var R = DragDropContext(HTML5Backend)(Root);

            res.render('default', {
               html: ReactDOM.renderToString(<R/>),
               meta: DocumentMeta.renderAsReact(),
               url: req.originalUrl,
               data: state
            });
         }
      });
   });
}
