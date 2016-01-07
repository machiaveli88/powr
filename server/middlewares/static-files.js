var express = require('express');
//var staticAsset = require("./expiry");
var path = require("path");

module.exports = function (app, folders) {
   if(app.get('assets')){
      app.use(express.static(app.get('assets')));
   }
   else{
      app.use(express.static(path.join(app.get('root'), "app", "assets")));
   }
   app.use(express.static(path.join(app.get('root'), "node_modules", "powr", "assets")));
   app.use(express.static(path.join(app.get('root'), "node_modules", "powr-ui", "assets")));
   //app.use(express.static(path.join(global.ROOT, "app", "assets")));
   /*if (!DEBUG) {
    app.use(staticAsset("./app/assets"));
    app.use(staticAsset("./node_modules/cryo-app/assets"));
    app.use(staticAsset("./node_modules/cryo-ui/assets/www"));
    }
    else {
    server.use(function (req, res, next) {
    req.assetFingerprint = function (str) {
    return str;
    };
    res.locals.assetFingerprint = function (str) {
    return str;
    };
    next();
    });
    }
    app.use(loopback.static("./app/assets"));
    app.use(loopback.static("./node_modules/cryo-app/assets"));
    app.use(loopback.static("./node_modules/cryo-ui/assets/www"));*/
}
