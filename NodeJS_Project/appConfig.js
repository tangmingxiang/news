const express = require("express");
const path = require('path');
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

const indexRouter = require('./routes/index');
const passportRouter = require('./routes/passport');
const detailRouter = require('./routes/detail');
const profileRouter = require('./routes/profile');
const common = require('./utils/common')
const Keys = require("./keys");

// 以面向对象的方式进行封装
class APPConfig{

    constructor(app){
        this.app = app;
        this.listenPort = 9000;
    }
    run(){
        // 指定静态资源文件夹
        this.app.use(express.static("public"))

        // 获取post请求参数
        this.app.use(express.urlencoded({extended: false})) 
        this.app.use(express.json())

        // 注册cookie和session
        this.app.use(cookieParser());
        this.app.use(cookieSession({
            name: "my_session",   // 相当于给这个session起个名字
            keys: [Keys.session_keys],   // 用于内部加密(注意以数组的形式进行书写)
            maxAge: 1000 * 60 * 60 * 24 * 2   // 2天 过期时间
        }));

        // 配置模板引擎
        this.app.engine('html', require('express-art-template'));
        this.app.set('view options', {           
            debug: process.env.NODE_ENV !== 'development'
        });
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', '.html');

        // 注册路由
        this.app.use(common.csrfProtect,indexRouter);
        this.app.use(common.csrfProtect,passportRouter);
        this.app.use(common.csrfProtect,detailRouter);
        this.app.use(common.csrfProtect,profileRouter);
        

        // 默认处理请求的函数，即前面的路径都不匹配的情况下，执行这里的代码
        this.app.use((req, res) => {
            common.abort404(req,res);
        })
    }

    // constructor(app){
    //     this.app = app;
    //     // 指定静态资源文件夹
    //     this.app.use(express.static("public"))

    //     // 获取post请求参数
    //     this.app.use(express.urlencoded({extended: false})) 
    //     this.app.use(express.json())

    //     // 注册cookie和session
    //     this.app.use(cookieParser());
    //     this.app.use(cookieSession({
    //         name: "my_session",   // 相当于给这个session起个名字
    //         keys: ["d23sada2313/%#E#WR%^^&ERETDFGG%^*^&DHdhsda"],   // 用于内部加密(注意以数组的形式进行书写)
    //         maxAge: 1000 * 60 * 60 * 24 * 2   // 2天 过期时间
    //     }));

    //     // 配置模板引擎
    //     this.app.engine('html', require('express-art-template'));
    //     this.app.set('view options', {           
    //         debug: process.env.NODE_ENV !== 'development'
    //     });
    //     this.app.set('views', path.join(__dirname, 'views','news'));
    //     this.app.set('view engine', '.html');
    // }
}

module.exports = APPConfig;

// // 以函数的方式进行封装
// let appConfig = app => {
//     // 指定静态资源文件夹
//     app.use(express.static("public"))

//     // 获取post请求参数
//     app.use(express.urlencoded({extended: false})) 
//     app.use(express.json())

//     // 注册cookie和session
//     app.use(cookieParser());
//     app.use(cookieSession({
//         name: "my_session",   // 相当于给这个session起个名字
//         keys: ["d23sada2313/%#E#WR%^^&ERETDFGG%^*^&DHdhsda"],   // 用于内部加密(注意以数组的形式进行书写)
//         maxAge: 1000 * 60 * 60 * 24 * 2   // 2天 过期时间
//     }));

//     // 配置模板引擎
//     app.engine('html', require('express-art-template'));
//     app.set('view options', {           
//         debug: process.env.NODE_ENV !== 'development'
//     });
//     app.set('views', path.join(__dirname, 'views','news'));
//     app.set('view engine', '.html');
// }

// module.exports = appConfig;