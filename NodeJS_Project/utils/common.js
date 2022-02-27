const handleDB = require('../db/handleDB')
// 公共的工具函数
function csrfProtect(request, response, next){
    // 这里的代码什么时候执行？？
    // 在执行router下接口之前， 来执行这个函数里面的代码

    if(request.method === "GET"){
        // 渲染转账页面的时候，同时在cookie中设置csrf_token
        //设置cookie和session
        // console.log('设置csrf_token');
        let csrf_token = getRandomString(48);
        response.cookie('csrf_token', csrf_token); 

    }else if(request.method === "POST"){
        // console.log(request.headers["x-csrftoken"]);
        // console.log(request.cookies["csrf_token"]);
        
        if((request.headers["x-csrftoken"] === request.cookies["csrf_token"])){
            console.log("csrf验证通过！");
   
        }else{
            response.send({errmsg:"csrf验证不通过！"});
            return
        }    
    }
    
    next()
    
}
// 生成n位随机字符串
function getRandomString(n){
    var str="";
    while(str.length<n){
      str+=Math.random().toString(36).substring(2);
    }
    return str.substring(str.length-n)
}

async function getUser(req, res){
    let user_id = req.session["user_id"];
    let result = [];
    // 若可获取到user_id的值
    if(user_id){
        // 获取与user_id对应的用户信息
        try {
            result = await handleDB(res, "info_user", "find", "查询数据库出错", `id=${user_id}`) 
        } catch (error) {
            console.log("common中查询用户名失败");
        }
    }
    return result;
}
 
// 抛出404页面的操作
async function abort404(req,res){
    let userInfo =  await getUser(req,res);
    let data ={
        user_info:userInfo[0]?{
            nick_name: userInfo[0].nick_name,
            avatar_url: userInfo[0].avatar_url
        }:false
    }
    res.render("news/404", data);
}

module.exports = {
    csrfProtect,
    getUser,
    abort404
}