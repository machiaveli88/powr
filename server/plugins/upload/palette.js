/*!
 * @module image-palette
 */

/**
 * Module dependencies.
 */

var quantize = require('quantize');
var readimage = require('readimage');
var fs = require('fs');


/**
 * Expose `palette`.
 */

module.exports = palette;

/**
 * Return the color palette for the file given in `path`
 * consisting of `n` RGB color values, defaulting to 5.
 * Returning value is passed to a callback
 *
 * @param {String} path
 * @param {Function} cb
 * @param {Number} n
 * @api public
 */

function palette(path, cb, n) {
    console.log(path);
    var file = typeof path === "string" ? fs.readFileSync(path) : path;

    n = n || 5;

    return readimage(file, function (err, image) {
        if(err){
           return cb(err, null);
        }
        //transform image data for quantization
        var rawData = image.frames[0].data;
        var len = rawData.length;
        var data = [];

        for (var i = 0; i < len; i += 4) {
            // semi-transparent
            if (rawData[i + 3] < 0xaa) continue;
            data.push([rawData[i], rawData[i + 1], rawData[i + 2]]);
        }

        var colors = quantize(data, n).palette();
        cb(null, colors.map(function(item){return rgbToHex(item)}));
    });
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(arr) {
    return componentToHex(arr[0]) + componentToHex(arr[1]) + componentToHex(arr[2]);
}