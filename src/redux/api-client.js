import axios from "axios";

// get, post, put, patch, del
export default class ApiClient {
   constructor(config, req) {
      this.config = config;
      ["get", "post", "put", "patch", "delete"].
         forEach((method) => {
            this[method] = (path, options) => {
               let params = {
                  withCredentials: true,
                  headers: {Accept: 'application/json'},
                  params: {}
               };
               if (SERVER) {
                  params.params.server_token = config.serverToken;
                  if (req.get("cookie")) {
                     params.headers.cookie = req.get("cookie");
                  }
               }
               if (method === "get" || method === "delete") {
                  options = params;
               }
               return new Promise((resolve, reject) => {
                  //setTimeout(()=> {
                  axios[method](this.formatUrl(path), options, params).then((result)=> {
                     if (result.data.error) {
                        // console.error(result.data.error);
                        reject(result.data.error);
                     }
                     else {
                        resolve(result.data);
                     }
                  }).catch((err)=>{
                     console.error(err);
                     reject(err);
                  });
                  //}, 1500);
               })
            };
         });
      this.upload = function(path, payload) {
         var promises = [].slice.call(payload.files).map((file, index)=>{
            var data = new FormData();
            data.append('file', file);
            return this.post(path, data);
         });
         return Promise.all(promises);
      }
   }

   // Format URL
   formatUrl(path) {
      let adjustedPath;
      // http://...
      if(path.indexOf("http") === 0){
         return path;
      }
      // ./upload => /upload
      else if(path.indexOf("./") === 0){
         adjustedPath = path.substr(1);
      }
      // /user => /api/user
      else if(path.indexOf("/") === 0){
         adjustedPath = "/api" + path;
      }
      // user => /api/user
      else {
         adjustedPath = "/api/" + path;
      }
      if (SERVER) {
         // Prepend host and port of the API server to the path.
         return this.config.url + adjustedPath;
      }
      else if (ELECTRON) {
         // Prepend host and port of the API server to the path.
         return ELECTRON.URL + adjustedPath;
      }
      // Prepend `/api` to relative URL, to proxy to API server.
      return adjustedPath;
   }
}
