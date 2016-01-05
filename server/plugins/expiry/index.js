var path = require("path"),
	fs = require("fs");

var labels = {};
var fingerprints = {};

module.exports = staticAsset;
var paths = [];

function staticAsset(rootPath) {
	paths.push(rootPath);

	//Express middleware
	function middleware(req, res, next) {
		//Check to see if req.url matches a fingerprinted URL
		var info = fingerprints[req.originalUrl];
		//If this request matches a fingerprint
		if(info)
		{
			//Set headers
			if(info.lastModified)
				res.setHeader("Last-Modified", info.lastModified.toUTCString() );
			if(info.etag)
				res.setHeader("ETag", info.etag);
			if(info.expires)
			{
				res.setHeader("Expires", info.expires.toUTCString() );
				res.setHeader("Cache-Control", "public; max-age=" +
					Math.floor((info.expires.getTime() - new Date().getTime() ) / 1000) );
			}
			//Check If-Modified-Since and If-None-Match headers and return 304, if appropriate
			if((req.headers["if-none-match"] && info.etag == req.headers["if-none-match"]) ||
				(req.headers["if-modified-since"] && info.lastModified.toUTCString() ==
					req.headers["if-modified-since"]) )
				return (res.sendStatus || res.send).call(res, 304);
		}
		//If req.assetFingerprint is already there, do nothing.
		if(!req.assetFingerprint)
		{
			//Create req.assetFingerprint
			req.assetFingerprint = staticAsset.assetFingerprint;
			//Expose req.assetFingerprint in Express helper
			res.locals.assetFingerprint = function() {
				return staticAsset.assetFingerprint.apply(req, arguments);
			};
		}
		//Run next middleware
		next();
	};
	//req.assetFingerprint function


	//Export assetFingerprint on middleware function and return middleware
	middleware.assetFingerprint = staticAsset.assetFingerprint;
	return middleware;
};

//Expose cache strategies
staticAsset.strategies = require("./cache-strategies");
var strategy = staticAsset.strategies["default"];
staticAsset.assetFingerprint = function assetFingerprint(label, fingerprint, cacheInfo) {
	if(arguments.length > 1)
	{
		//Add a label
		var labelInfo = labels[label] = {"fingerprint": fingerprint};
		if(cacheInfo)
			for(var i in cacheInfo)
				labelInfo[i] = cacheInfo[i];
	}
	else
	{
		//Try to get a fingerprint from a registered label
		var info = labels[label];
		if(info)
		{
			fingerprints[info.fingerprint] = info;
			return info.fingerprint;
		}
		else
		{
			info = {};
			//Try to get a fingerprint using the specified cache strategy
			var fullPath;
			for(var i = 0; i<paths.length; i++){
				var _fullPath = path.resolve(paths[i] + "/" + (label || this.url) );
				if(fs.existsSync(_fullPath) ){
					fullPath = _fullPath;
					break;
				}
			}
			if(!fullPath)
				return label;
			//Use the "cache strategy" to get a fingerprint
			//Prefer the use of etag over lastModified when generating fingerprints
			if(strategy.lastModified)
			{
				var mdate = info.lastModified = strategy.lastModified(fullPath);
				mdate.setMilliseconds(0);
			}
			if(strategy.etag)
				info.etag = strategy.etag(fullPath);
			if(strategy.expires)
				info.expires = strategy.expires(fullPath);
			if(strategy.fileFingerprint)
			{
				var fingerprint = strategy.fileFingerprint(label, fullPath);
				fingerprints[fingerprint] = info;
				return fingerprint;
			}
			return label; //Do not generate a fingerprint
		}
	}
}