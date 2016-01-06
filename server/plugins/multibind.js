module.exports =  function(arr){
   return function(endpoint){
      if(!endpoint) endpoint = "";
      if(!Array.isArray(endpoint)) endpoint = [endpoint];
      var array = [];
      arr.forEach(function(item){
         endpoint.forEach(function(endpoint){
            array.push(item + endpoint);
         })
      })
      return array;
   }
}
