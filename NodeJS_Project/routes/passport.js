const express = require('express');
const Captcha = require('../utils/captcha');
const handleDB = require('../db/handleDB');
const moment = require('moment');
const md5 = require("md5");
const Keys = require("../keys");
const router = express.Router();

router.get("/passport/image_code/:id",(request, response) => {
    let captchaObj = new Captcha();
    let captcha = captchaObj.getCode();

    captcha.text // 图片验证码的文本
    captcha.data // 图片验证码的图片内容信息
    console.log(captcha.text);

    //报存图片验证码文本到session
    request.session["imageCode"] = captcha.text;

    // 配合img标签的src属性请求来展示验证码图片时，需设置响应头
    response.setHeader('Content-Type','image/svg+xml');
    response.send(captcha.data); // 响应验证码图片到浏览器

})

router.post("/passport/register",(request, response) =>{
    (async function(){
        // 1、获取post参数，判空
        let {username, image_code, password, agree} = request.body;
        // 若username, image_code, password, agree四者之一为空，则return
        if(!username || !image_code || !password || !agree){
            response.send({errmsg:'必填信息不完整'});
            return
        } 
        // 2、验证用户输入的图片验证码是否正确，不正确则return
        if(request.session["imageCode"].toLowerCase() !== image_code.toLowerCase()){
            response.send({errmsg:'验证码错误'});
            return
        }
        // 3、查询数据库，判断用户名是否已被注册
        let result = await handleDB(response,'info_user', "find", '数据库查询出错', `username='${username}'`);
        // 用户名已被注册
        if(result[0]){
            response.send({errmsg:'用户名已经被注册'});
            return
        }
        // 4、用户名不存在，就在数据库中新增一条记录
        let result2 = await handleDB(response, "info_user", "insert", "数据库插入出错", {
            username,
            password_hash:md5(md5(password)+Keys.password_salt),
            nick_name:username,
            last_login: moment().format('YYYY-MM-DD HH:mm:ss'),
            avatar_url: "/news/images/worm.jpg"
        })
        // 5、保持用户的登录状态
        request.session["user_id"] = result2.insertId;
        // 6、返回注册成功
        response.send({errno:0,errmsg:'注册成功'});
    })();

    // response.send(`${request.session["imageCode"] === request.body.image_code}`);
})

router.post("/passport/login",(request, response) => {
    
    (async function(){
        // 1、获取post请求参数，判空
        let {username, password} = request.body;
        if(!username || !password){
            response.send({errmsg:'必填信息不完整'});
            return
        }
        //2、查询数据库，验证用户名是否注册
        let result = await handleDB(response,'info_user', "find", '数据库查询出错', `username='${username}'`);
        if(!result[0]){
            response.send({errmsg:'密码不正确，登录失败'});
            return
        }
        //3、校验密码是否正确
        if(md5(md5(password)+Keys.password_salt) !== result[0].password_hash){
            response.send({errmsg:'密码不正确，登录失败'});
            return
        }
        //4、保持登录状态
        // 设置last_login(最后一次的登录时间)字段
        await handleDB(response, "info_user", "update", "数据库修改出错", `id=${result[0].id}`, {last_login: moment().format('YYYY-MM-DD HH:mm:ss')})
        request.session["user_id"] = result[0].id;
        //5、返回登录成功给前端
        response.send({errno:0,errmsg:'登录成功'});
    })();
})

router.post("/passport/logout",(request, response) => {
    // 退出登录即删除session中的uesr_id
    delete request.session["user_id"];
    response.send({errmsg:'退出登录成功'});
})

module.exports = router;