// ExpressJs Server
var log = require("powr-utils/log")("app");
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var deepMerge = require('deep-extend');
var SequelizeStore = require('connect-sequelize')(session);
var compression = require('compression')

module.exports = function(_config) {
   var app = require('express')();
   app.server = require('http').Server(app);

   if(!_config) _config = {};

   // Set ssr
   if(app.get('env') === 'production'){
      app.set('ssr', true);
   }

   // Parse config keys to app.get(key)
   for(var key in _config){
      app.set(key, _config);
   }

   // powr-dev installed?
   if(app.get('env') === 'development' && !fs.existsSync(path.resolve('..', '..', 'powr-dev', 'package.json'))){
      log('Please install powr-dev')
   }

   // Add socket-io if available
   if(_config.socketIO){
      app.io = require('socket.io')();
   }

   app.passport = passport;
   require("./plugins/hook")(app);
   require("./middlewares/api-authorization")(app, _config);

   var config = deepMerge(require('./config')(), _config);
   app.set('port', config.port);

   log("Preparing app");

   require("./db/db")(app, config.database);

   app.bindModels = app.hook("bind:models", function () {
      log("Binding Models");
      this.after();
   });

   app.config = config;

   app.bindMiddlewares = app.hook("bind:middlewares", function () {
      log("Binding Middlewares");
      // Load webpack if development & powr-dev available
      if(app.get('env') === 'development' && fs.existsSync(path.resolve('..', '..', 'powr-dev', 'index.js'))){
         log("Loading webpack");
         require(path.resolve('..', '..', 'powr-dev', 'index.js'))(app);
      }
      // Classic express middlewares
      app.use(cookieParser(config.secret));
      // app.use(require('connect-multiparty')());
      if (DEBUG && fs.existsSync(path.resolve('..', '..', 'powr-dev', 'session-storage.js'))) {
         var FileStore = require(path.resolve('..', '..', 'powr-dev', 'session-storage.js'))(session);
         app.use(session({
            secret: config.secret,
            resave: true,
            maxAge: new Date(Date.now() + 3600000),
            saveUninitialized: true,
            store: new FileStore({
               retries: 50,
               path: path.resolve(ROOT, 'server', 'sessions')
            })
         }));
      }
      else {
         app.use(session({
            secret: config.secret,
            maxAge: new Date(Date.now() + 3600000),
            resave: true,
            saveUninitialized: true,
            store: new SequelizeStore(app.db),
            proxy: true
         }));
      }
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: true}));
      app.use(compression());
      var faviconPath = path.resolve(ROOT, 'app', 'assets', 'favicon.ico');
      if(fs.existsSync(faviconPath)){
         app.use(favicon(faviconPath));
      }
      require("./middlewares/api-token").init(app, config.secret);
      if(config.recaptcha){
         require("./middlewares/recaptcha")(app, config.recaptcha);
      }

      // More
      require("./middlewares/log")(app);
      require("./middlewares/access-control")(app);
      require("./middlewares/static-files")(app);
      //require("./plugins/heroku-survive")(app, config.url);
      if(config.upload){
         require("./middlewares/upload")(app, config.upload);
      }
      require("./middlewares/api-cache")(app, config.cache);
      require("./middlewares/api-context")(app);
      require("./plugins/sequelize/express-user")(app);
      app.get('/__status', function(req, res, next){
         res.json({status: 'ok'});
      })
      this.after();
   });

   // Hook so actions can be executed before/after, e.g. cache
   app.bindApi = app.hook("bind:api", function () {
      log("Binding API");
      // API
      require("./middlewares/api-hack")(app);
      require("./middlewares/googlemaps")(app);
      // require("./api-v1")(app, ["default", "v1"]);

      // Call after!
      this.after();
   });

   // Custom launch func
   app.launch = app.hook("launch", function () {
      app.bindModels();
      app.bindMiddlewares();
      app.bindApi();

      // React View Engine
      app.set('views', app.config.templates||app.templates);
      app.set('view engine', 'jsx');
      app.engine('jsx', require("./view-engine").createEngine());

      log("Last bindings");

      if(app.io) {
         log('Enabling socket.io');
         app.io.attach(app.server);
      }

      // Bind react/flux app to /**
      require("../lib/server")(app);

      // Handle errors/not-found
      require("./middlewares/error-handler")(app);

      log("Launching app");
      // Start server
      app.server.listen(app.get("port"), function(){
         setTimeout(function(){
            app.emit('started');
         }, 1000);
         log('The app is running at http://localhost:' + app.get('port') + " in " + app.get('env'));
      });
   });

   return app;
}
