var webpack = require('webpack');
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var sep = path.sep === "\\" ? "\\\\" : path.sep;
var JS_REGEX = /\.js$|\.jsx$|\.es6$|\.babel$/;
var DIR_REGEX = [new RegExp(sep + "node_modules" + "(?!" + sep + "cryo-" + ").+$"),
   new RegExp(sep + "node_modules" + "(" + sep + "cryo-" + ").+\\node_modules\\.+$")];

/*var libReact = path.resolve(ROOT, 'node_modules', 'react/dist/react.min.js');
 var libReactBootstrap = path.resolve(ROOT, 'node_modules', 'react-bootstrap/dist/react-bootstrap.min.js');
 var libReactRouter = path.resolve(ROOT, 'node_modules', 'react-router/umd/ReactRouter.min.js');
 var libReactDnd = path.resolve(ROOT, 'node_modules', 'react-dnd/dist/ReactDnD.min.js');
 var libMoment = path.resolve(ROOT, 'node_modules', 'moment/min/moment.min.js');
 var libReactIntl = path.resolve(ROOT, 'node_modules', 'react-intl/dist/react-intl.min.js');*/

var ROOT = global.ROOT = process.cwd();
var DEBUG = global.DEBUG = false;
var NODE_ENV = global.NODE_ENV = "production";

console.log('ROOT', ROOT);

module.exports = function(config){
   return {
      cache: false,
      debug: false,
      // devtool: 'source-map',
      devtool: null,
      // Entry point for static analyzer:
      entry: [
         path.resolve(ROOT, 'app', 'browser.js')
      ],

      output: {
         path: path.resolve(ROOT, 'app', 'assets'),
         filename: 'bundle.js',
         chunkFilename: '[id].chunk.js',
         publicPath: '/'
      },

      plugins: [
         //new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
         //new webpack.IgnorePlugin(/jquery$/),
         new ExtractTextPlugin('bundle.css'),
         new webpack.DefinePlugin({
            "process.env": {
               BROWSER: JSON.stringify(true),
               NODE_ENV: JSON.stringify('production')
            },
            DEBUG: false,
            IO: config.socketIO,
            APP_URL: JSON.stringify(config.url),
            //PHONEGAP: false,
            BROWSER: true,
            SERVER: false
         }),
         new webpack.optimize.DedupePlugin(),
         new webpack.optimize.OccurenceOrderPlugin(),
         new webpack.optimize.UglifyJsPlugin({
            compress: {
               warnings: false
               /* screw_ie8: true,
                sequences: true,
                dead_code: true,
                drop_debugger: true,
                comparisons: true,
                conditionals: true,
                evaluate: true,
                booleans: true,
                loops: true,
                unused: true,
                hoist_funs: true,
                if_return: true,
                join_vars: true,
                cascade: true,
                drop_console: true*/
            },
            output: {
               comments: false
            }
         }),
         function(){
            /*this.plugin('done', function(stats) {
             require('fs').writeFileSync(
             path.resolve(ROOT, "server", "webpack-stats.json"),
             JSON.stringify(stats.toJson())
             );
             })*/
         }
      ],

      resolve: {
         root: ROOT,
         /*alias: {
          react: libReact,
          'react-bootstrap': libReactBootstrap,
          'react-router': libReactRouter,
          //'react-dnd': libReactDnd,
          moment: libMoment,
          'react-intl': libReactIntl,
          'react-dom': path.resolve(ROOT, 'node_modules', 'react-dom'),
          //'react-dnd/modules/backends/HTML5': path.resolve(ROOT, 'node_modules', 'react-dnd/modules/backends/HTML5'),
          'react-addons-transition-group': path.resolve(ROOT, 'node_modules', 'react-addons-transition-group')
          },*/
         // Allow to omit extensions when requiring these files
         modulesDirectories: ['node_modules', 'app'],
         extensions: ['', '.js', '.jsx', '.less', '.css', '.woff', '.eot', '.json']
      },

      resolveLoader: {
         //root: [THIS]
      },

      module: {
         loaders: [
            {
               test: JS_REGEX,
               loader: 'babel',
               query: {
                  stage: 0
               },
               exclude: DIR_REGEX
            },
            {
               test: /\.json$/,
               loader: 'json'
            },
            {
               test: /\.(woff|eot|ttf)$/,
               loader: 'url?limit=10000&name=[sha512:hash:base64:7].[ext]'
            },
            /*{
             test: /\.(jpe?g|png|gif|svg)$/,
             loader: 'url?limit=10000&name=[sha512:hash:base64:7].[ext]!image?optimizationLevel=7&progressive&interlaced'
             },*/
            {
               test: /\.scss$/,
               loader: ExtractTextPlugin.extract('style', 'raw?autoprefixer?browsers=last 2 version!sass')
            },
            {
               test: /\.less$/,
               loader: ExtractTextPlugin.extract('style', 'raw?autoprefixer?browsers=last 2 version!less')
            },
            {
               test: /\.css$/,
               loader: ExtractTextPlugin.extract('style', 'raw?autoprefixer?browsers=last 2 version')
            }
         ],
         noParse: [/*libReact, libReactBootstrap, libReactRouter,
          //libReactDnd,
          libMoment, libReactIntl,
          path.resolve(ROOT, 'node_modules', 'react-dom'),
          //path.resolve(ROOT, 'node_modules', 'react-dnd/modules/backends/HTML5'),
          path.resolve(ROOT, 'node_modules', 'react-addons-transition-group')*/]
      }
   };
}
