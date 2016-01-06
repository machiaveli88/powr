var express = require('express');
//var staticAsset = require("./expiry");
var path = require("path");

module.exports = function (app, folders) {
   if (!folders) folders = {};
   app.use(express.static(path.join(global.ROOT, "app", "assets")));
   app.use(express.static(path.join(global.ROOT, "node_modules", "cryo-ui", "assets")));
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
