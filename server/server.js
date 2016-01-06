'use strict';

var json = require('../package.json');

process.on('uncaughtException', function (err) {
   console.error(err);
});
// Fix eventemitter
//require('events').EventEmitter.prototype._maxListeners = 0;

/*
 require("babel-core/register")({
 stage: 0,
 ignore: [/\/node_modules.+$/]
 });
 */

// Set globals/env
require("./globals")();

// Return express instance
module.exports = require("./express");
