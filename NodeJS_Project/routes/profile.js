const express = require("express");
const md5 = require("md5");
const handleDB = require("../db/handleDB");
const common = require("../utils/common");
const upload_file = require("../utils/qn");
const constant = require("../utils/constant");
const keys = require("../keys");
const multer = require('multer');

const upload = multer({ dest: 'public/news/upload/avatar' })  // 上传头像存放的地址	
const router = express.Router();

router.get("/profile", (req, res)=>{
    (async function(){

        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            // 没有登录，就重定向到首页
            res.redirect("/");
            return
        }

        let data = {
            user_info:{
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url? (constant.QINIU_AVATAR_URL_PRE + userInfo[0].avatar_url) :"/news/images/worm.jpg"
            }
        }
        res.render("news/user", data)
    })();
    
})

// 展示基本信息页面，以及处理基本信息的POST提交
router.all("/user/base_info",(req, res)=>{
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }

        if(req.method==="GET"){
            let data = {
                nick_name:userInfo[0].nick_name,
                signature:userInfo[0].signature,
                gender:userInfo[0].gender?userInfo[0].gender:"WOMAN"
            }
            res.render("news/user_base_info", data)
        }else if(req.method==="POST"){
            // 1、获取参数判空
            let {signature, nick_name, gender} = req.body
            if(!signature || !nick_name || !gender){
                res.send({errmsg:"参数错误"})
                return
            }
            // 2、修改数据库中的用户数据
            await handleDB(res, "info_user", "update", "数据库更新数据出错", `id=${userInfo[0].id}`,{
                signature,
                nick_name,
                gender
            })
            // 3、返回操作成功
            res.send({errno:"0", errmsg:"操作成功"})
        }
    })();
})

// 展示修改密码页面(GET)以及保存密码修改的操作(POST提交)
router.all("/user/pass_info",(req, res)=>{
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }

        if(req.method==="GET"){

            res.render("news/user_pass_info");
        }else if(req.method==="POST"){
            // 1、获取参数(旧密码，新密码)
            let {old_password, new_password, new_password2} = req.body;
            if(!old_password || !new_password || !new_password2){
                res.send({errmsg:"参数错误"})
                return
            }
            console.log(old_password, new_password, new_password2);
            
            // 2、校验两次新密码是否一致
            if(new_password !== new_password2){
                res.send({errmsg:"两次密码不一致"})
                return
            }
            // 3、校验旧密码是否正确
            if(md5(md5(old_password)+keys.password_salt) !== userInfo[0].password_hash){
                res.send({errmsg:"旧密码不正确，修改失败"})
                return
            }
            // 4、修改用户表里面的password_hash
            await handleDB(res, "info_user", "update", "数据库更新数据出错", `id=${userInfo[0].id}`,{
                password_hash:md5(md5(new_password)+keys.password_salt)
            })
            // 5、返回修改成功
            res.send({errno:"0", errmsg:"操作成功"})
        }

    })();
})

// 展示修改头像页面
router.get("/user/pic_info",(req, res)=>{
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }
        userInfo[0].avatar_url = constant.QINIU_AVATAR_URL_PRE + userInfo[0].avatar_url;
        res.render("news/user_pic_info", userInfo[0])
    })();
})

// 提交头像图片的接口
router.post("/user/pic_info", upload.single("avatar"),(req, res)=>{ // upload.single("avatar") 钩子函数: 作用是接收图片
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }
        // 1、接收上传图片的对象req.file
        let file = req.file
        if(!file){
            res.send({errmsg: "请重新选择头像，并确保头像的格式是正确的"})
            return
        }
        // console.log(req.file); // req.file 本次上传图片的一些信息

        // 2、上传图片到七牛云服务器
        let retObj = {}
        try {
            // retObj = await upload_file('02.jpg', './02.jpg')
            retObj = await upload_file(file.originalname, `${file.destination}/${file.filename}`)  
            console.log(retObj);
        } catch (error) {
            console.log(error);
            res.send({errmsg: "头像上传七牛云出错"})
            return
        }

        // 3、把七牛云返回的对象的key属性保存到数据库
        try {
            await handleDB(res, "info_user", "update", "数据库修改数据出错", `id=${userInfo[0].id}`,{
                avatar_url:file.originalname
            })
        } catch (error) {
            res.send({errmsg: error.message})
            return
        }
        

        // 4、返回上传成功
        let data = {
            avatar_url: constant.QINIU_AVATAR_URL_PRE + file.originalname
        }
        res.send({errno:"0", errmsg:"上传成功", data})
    })();
})

// 展示收藏的新闻页面
router.get("/user/collections",(req, res)=>{
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }

        let { p=1 } = req.query;
        let currentPage = p;

        let counts = await handleDB(res, "info_user_collection", "sql", "数据库查询出错", `select count(*) from info_user_collection where user_id=${userInfo[0].id}`)
        let totalPage = Math.ceil(counts[0]["count(*)"]/10);
        // console.log(totalPage);

        // 查询用户收藏的新闻的标题和创建时间字段
        // 1、先查询到登录用户收藏过的新闻的id（分页查询）
        let collectionNewsIdList = await handleDB(res, "info_user_collection", "find", "数据库查询出错2", `user_id=${userInfo[0].id} limit ${(currentPage-1)*10},10`)
        // console.log(collectionNewsIdList);
        // 2、遍历collectionNewsIdList，拿着里面的每一个元素的news_id去查询info_news表
        let collectionNewsList = [];
        for (let i = 0; i < collectionNewsIdList.length; i++){
            let ret = await handleDB(res, "info_news", "sql", "数据库查询出错3",
                `select title,create_time from info_news where id=${collectionNewsIdList[i].news_id}`);
            collectionNewsList[i] = ret[0]
        }
        // console.log(collectionNewsList);

        let data = {
            currentPage,
            totalPage,
            collectionNewsList
        }

        res.render("news/user_collection", data)
    })();
})

// 展示修改头像页面
router.get("/user/test",(req, res)=>{
    (async function(){
        //获取用户登录信息，获取不到就重定向到首页
        let userInfo = await common.getUser(req, res);
        if(!userInfo[0]){
            res.redirect("/");
            return
        }
        res.render("news/test")
    })();
})

module.exports = router