const Base64 = require("js-base64").Base64;
let result = Base64.encode('hello');      // aGVsbG8=
let result2 = Base64.decode('aGVsbG8=');  // hello
console.log(result);
console.log(result2);

const md5 = require("md5");
console.log(md5(md5("hello")+"23#$%$$EFERE%$#%^$%@##REWREW"));      //5d41402abc4b2a76b9719d911017c592  

const jwt = require('jsonwebtoken');
const salt = "23#$%$$EFERE%$#%^$%@##REWREW";
// 获取jwt_token
const token = jwt.sign({id:1,username:"zhangsan"},salt,{expiresIn: 60 * 60 * 2})   //expiresIn为过期时间，单位是秒
console.log(token);
// 验证jwt_token
try{
    var userData = jwt.verify(token, salt);   //获取token中的数据(用户信息)
}catch(e){
    console.log("token已经过期")
}
console.log(userData)
setTimeout(() => {
    try{
        var uD = jwt.verify(token, salt);   //获取token中的数据(用户信息)
    }catch(e){
        console.log("token已经过期")
    }
    console.log(uD)
},5000)

