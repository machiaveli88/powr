var webpack = require('webpack');
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var sep = path.sep === "\\" ? "\\\\" : path.sep;
var JS_REGEX = /\.js$|\.jsx$|\.es6$|\.babel$/;
var DIR_REGEX = [new RegExp(sep + "node_modules" + "(?!" + sep + "cryo-" + ").+$"),
   new RegExp(sep + "node_modules" + "(" + sep + "cryo-" + ").+\\node_modules\\.+$")];

// \\node_modules(\\cryo-).+\\node_modules\\.+$
var THIS = path.resolve(__dirname, '..', '..', 'node_modules');

module.exports = function (config) {
   return {
      displayErrorDetails: true,
      devtool: 'eval',

      // Entry point for static analyzer:
      entry: [
         //path.resolve(THIS, 'webpack-hot-middleware/client'),
         'webpack-hot-middleware/client',
         path.resolve(ROOT, 'app', 'browser.js')
      ],

      output: {
         path: path.resolve(ROOT, 'app', 'assets'),
         filename: 'bundle.js',
         chunkFilename: '[id].chunk.js',
         publicPath: '/'

         /*// Where to put build results when doing production builds:
         // (Server doesn't write to the disk, but this is required.)
         path: path.resolve(ROOT, 'app', 'assets'),
         // Filename to use in HTML
         filename: 'bundle.js',
         // Path to use in HTML
         publicPath: '/'*/
      },

      resolve: {
         modulesDirectories: ['node_modules', 'app'],
         // Allow to omit extensions when requiring these files
         //root: THIS,
         //root: [ROOT, THIS],
         //root: path.resolve(ROOT, 'app'),
         extensions: ['', '.js', '.jsx', '.less', '.css', '.woff', '.eot', '.json']
      },

      resolveLoader: {
         //root: [THIS]
      },

      plugins: [
         new webpack.HotModuleReplacementPlugin(),
         new webpack.NoErrorsPlugin(),

         new webpack.DefinePlugin({
            'process.env': {
               BROWSER: JSON.stringify(true),
               NODE_ENV: JSON.stringify('development')
            },
            APP_URL: JSON.stringify(config.url),
            DEBUG: true,
            IO: config.socketIO,
            //PHONEGAP: false,
            BLUEBIRD_DEBUG: 1,
            BROWSER: true,
            SERVER: false
         })/*,
          function(){
          this.plugin('done', function(stats) {
          require('fs').writeFileSync(
          path.resolve(ROOT, "server", "webpack-stats.json"),
          JSON.stringify(stats.toJson())
          );
          })
          }*/
      ],

      module: {
         loaders: [
            {
               test: JS_REGEX,
               loader: 'babel',
               query: {
                  stage: 0,
                  //plugins: [path.resolve(THIS, 'babel-plugin-react-transform')],
                  plugins: ['babel-plugin-react-display-name', 'babel-plugin-react-transform'],
                  extra: {
                     "react-transform": {
                        transforms: [{
                           //"transform": path.resolve(THIS, "react-transform-hmr"),
                           "transform": "react-transform-hmr",
                           "imports": ["react"],
                           "locals": ["module"]
                        }, {
                           //"transform": path.resolve(THIS, "react-transform-catch-errors"),
                           "transform": "react-transform-catch-errors",
                           //"imports": ["react", path.resolve(THIS, "redbox-react")]
                           "imports": ["react", "redbox-react"]
                        }]
                     }
                  }
               },
               exclude: DIR_REGEX
            },
            {
               test: /\.json$/,
               loader: 'json'
            },
            {
               test: /\.less$/,
               loader: "style!raw?sourceMap!autoprefixer?browsers=last 2 version!less?outputStyle=expanded&sourceMap"
            },
            {
               test: /\.css$/,
               loader: "style!raw?sourceMap!autoprefixer?browsers=last 2 version"
            },
            {test: /\.png$/, loader: "url?limit=10000&mimetype=image/png"},
            {test: /\.(woff|woff2)$/, loader: "url?limit=10000&mimetype=application/font-woff"},
            {test: /\.ttf$/, loader: "url?limit=10000&mimetype=application/octet-stream"},
            {test: /\.eot$/, loader: "url?limit=10000&mimetype=image/svg+xml"},
            {test: /\.svg$/, loader: "url?limit=10000&mimetype=image/svg+xml"}
         ]
      }
   }
};
