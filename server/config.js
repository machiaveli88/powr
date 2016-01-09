// Config values
var path = require("path");
var fs = require("fs");

module.exports = function(config){
   if(!config || !config.app){
      throw new Error('No config, or no config.entry defined');
   }

   var appPath = path.dirname(config.app);

   var root = fs.existsSync(path.resolve(appPath, 'package.json'))
      ? path.resolve(appPath)
      : path.resolve(appPath, '..')

   var packageJson = require(path.resolve(root, 'package.json'));

   //var appPath = config.appPath || process.cwd() || path.dirname(require.main.filename);
   require("babel-core/register")({
      stage: 0,
      only: appPath,
      //only: path.dirname(config.app),
      ignore: /\/node_modules/
   });

   config = Object.assign({
      ssr: process.env.NODE_ENV === "production",
      appPath: appPath,
      root: root,
      name: packageJson.name,
      version: packageJson.version,
      templates: path.resolve(__dirname, '..', 'lib', 'templates'),
      log: process.env.DEBUG || "cryo*,app*,powr*",
      debug: process.env.NODE_ENV !== "production",
      port: process.env.PORT || 3000,
      cache: {
         minutes: 0
      },
      secret: "keyboardcat",
      database: {
         logging: false,
         dialect: 'sqlite'
      }
   }, config);

   if(!config.url){
      config.url = 'http://localhost:'+config.port
   }

   return config;
}
