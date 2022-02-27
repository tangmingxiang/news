const template = require("art-template");
template.defaults.imports.classNameFilter = function(value){
    // value 接收 | 前面的值
    if(value === 0){
        return "first"
    }
    if(value === 1){
        return "second"
    }
    if(value === 2){
        return "third"
    }
    return ""
}

template.defaults.imports.dateFormat = function(value){
    var d = new Date(value);  //2018-01-16T21:19:19.000Z
    var times=d.getFullYear() + '-' + 
        (d.getMonth()<9? '0' + (d.getMonth()+1) : (d.getMonth()+1))+ '-' + 
        (d.getDate()<10? '0' + d.getDate() : d.getDate()) + ' ' +
        (d.getHours()<10? '0' + d.getHours() : d.getHours()) + ':' + 
        (d.getMinutes()<10? '0' + d.getMinutes() : d.getMinutes()) + ':' + 
        (d.getSeconds()<10? '0' + d.getSeconds() : d.getSeconds()); 
    // var times=d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(); 
    return times
}