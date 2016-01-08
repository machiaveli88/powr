// Config values
var path = require("path");

module.exports = function(config){
   if(!config || !config.app){
      throw new Error('No config, or no config.entry defined');
   }

   var appPath = path.dirname(config.app);

   var packageJson = fs.existsSync(path.resolve(appPath, 'package.json'))
      ? require(path.resolve(appPath, 'package.json'))
      : require(path.resolve(appPath, '..', 'package.json'))

   //var appPath = config.appPath || process.cwd() || path.dirname(require.main.filename);
   require("babel-core/register")({
      stage: 0,
      only: appPath,
      //only: path.dirname(config.app),
      ignore: /\/node_modules/
   });

   config = Object.assign({
      ssr: process.env.NODE_ENV === "production",
      root: appPath,
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
