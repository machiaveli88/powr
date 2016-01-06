module.exports =  function(v){
    var arr;
    if(typeof v === "string"){
        arr = [v];
    }
    if(Array.isArray(v)){
        arr = v;
    }
    if(arr){
        return arr.map(function(base){
            return "/api" + (base === "default" ? "" : ("/" + base));
        })
    }
    throw new Error(v + " not string/array");
}
