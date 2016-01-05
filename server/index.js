var json = require('../package.json');

process.on('uncaughtException', function(err){
   console.error(err)
});
// Fix eventemitter
//require('events').EventEmitter.prototype._maxListeners = 0;

// Babel for ES6/ES7
require("babel-core/register")({
    stage: 0,
    ignore: /\/node_modules(?!\/cryo).+$/
});

// Set globals/env
require("./globals")();

// Return express instance
module.exports = require("./express");


console.log(`Powr v ${json.version}
______   ______  _  _________
\\____ \\ /  _ \\ \\/ \\/ /\\_  __ \\
|  |_> >  <_> )     /  |  | \\/
|   __/ \\____/ \\/\\_/   |__|
|__|

© 2015 cryogon`
);
