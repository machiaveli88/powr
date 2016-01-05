export default function (app) {
   if (app.get('env') === 'development') {
      var webpack = require('webpack');
      var config = require("./webpack.debug.js")(app.config);
      var compiler = webpack(config);
      app.use(require('webpack-dev-middleware')(compiler, {
         noInfo: true,
         publicPath: config.output.publicPath
      }));

      app.use(require('webpack-hot-middleware')(compiler));
   }
}
