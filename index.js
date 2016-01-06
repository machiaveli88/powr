'use strict';

var moduleName = typeof BROWSER !== 'undefined' && BROWSER ? 'lib/browser' : 'server/server';

exports.CreateApp = exports.createApp = require('./' + moduleName);
exports.Log = exports.log = require('powr-utils/log');
