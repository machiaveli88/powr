// ExpressJs Server
var log = require("cryo-utils/log")("app");
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var deepMerge = require('deep-extend');
var SequelizeStore = require('connect-sequelize')(session);
var compression = require('compression')

var app = require('express')();
app.server = require('http').Server(app);

export default function (_config) {
   if(_config.socketIO){
      app.io = require('socket.io')();
   }

   app.passport = passport;
   require("cryo-utils/hook")(app);
   require("./plugins/api-authorization")(app, _config);

   var config = deepMerge(require('./config')(), _config);
   app.set('port', config.port);

   log("Preparing app");

   // React View Engine
   app.set('views', app.templates || config.templates);
   app.set('view engine', 'jsx');
   app.engine('jsx', require("./view-engine").createEngine());

   require("./db/db")(app, config.database);

   app.bindModels = app.hook("bind:models", function () {
      log("Binding Models");
      this.after();
   });

   app.config = config;

   app.bindMiddlewares = app.hook("bind:middlewares", function () {
      log("Binding Middlewares");
      require("./webpack")(app);
      // Classic express middlewares
      app.use(cookieParser(config.secret));
      // app.use(require('connect-multiparty')());
      if (DEBUG) {
         var FileStore = require('session-file-store')(session);
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
      app.use(favicon(path.resolve(ROOT, 'app', 'assets', 'favicon.ico')));
      require("./plugins/api-token").init(app, config.secret);
      if(config.recaptcha){
         require("./plugins/recaptcha")(app, config.recaptcha);
      }
      this.after();
   });

   app.bindPlugins = app.hook("bind:plugins", function () {
      log("Binding Plugins");
      // Custom Plugins
      require("./plugins/log")(app);
      require("./plugins/access-control")(app);
      require("./plugins/static-files")(app);
      //require("./plugins/heroku-survive")(app, config.url);
      if(config.upload){
         require("./plugins/upload")(app, config.upload);
      }
      require("./plugins/api-cache")(app, config.cache);
      require("./plugins/api-context")(app);
      require("cryo-utils/sequelize/express-user")(app);

      this.after();
   });

   // Hook so actions can be executed before/after, e.g. cache
   app.bindApi = app.hook("bind:api", function () {
      log("Binding API");
      // API
      require("./plugins/api-hack")(app);
      require("./plugins/googlemaps")(app);
      // require("./api-v1")(app, ["default", "v1"]);

      // Call after!
      this.after();
   });

   // Custom launch func
   app.launch = app.hook("launch", function () {
      log("Last bindings");

      if(app.io) {
         log('Enabling socket.io');
         app.io.attach(app.server);
      }

      // Bind react/flux app to /**
      require("./flux-app")(app);

      // Handle errors/not-found
      require("./plugins/error-handler")(app);

      log("Launching app");
      // Start server
      var instance = app.server.listen(app.get("port"), function(){
         app.emit('started');
         log('The app is running at http://localhost:' + app.get('port') + " in " + app.get('env'));
         //this.after();
      });
   });

   return app;
}
