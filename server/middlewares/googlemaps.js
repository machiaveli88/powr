var request = require('request');

module.exports = function (app) {
   app.use('/api/gmap/*', function (req, res, next) {
      var url = "http://maps.google.com/maps/api/" + req.originalUrl.split("/api/gmap/")[1];
      req.pipe(request(url, function (err, resp, body) {
         if(err){
            next(err);
         }
         /*if (err && err.code === 'ECONNREFUSED') {
            console.error('Refused connection');
            res.send(err);
         }
         else if (err && err.code === 'ETIMEDOUT') {
            console.error('Timedout connection');
            res.send(err);
         }
         else if (err && err.code === 'ENOTFOUND') {
            console.error('Not found connection');
            res.send(err);
         } else if (err) {
            res.send(err);
            throw err;
         }*/
      })).pipe(res);
   });

}
