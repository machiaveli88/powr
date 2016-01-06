var log = require("powr-utils/log")("server", "plugin", "log")
//var morgan = require('morgan');
var responseTime = require('response-time');

module.exports = function(app){
    //app.use(morgan('dev'));
    app.use(responseTime(function(req, res, time) {
        res.header('X-Response-Time', time);
    }));
}
