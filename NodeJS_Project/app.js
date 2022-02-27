const express = require("express");
const app = express();

// 以函数的形式进行封装时的调用
// const appConfig = require("./appConfig");
// appConfig(app); // 配置app 

// 以对象的形式进行封装时的调用 
const AppConfig = require("./appConfig");
let appConfig = new AppConfig(app);
appConfig.run();


app.listen(appConfig.listenPort, ()=>{
    console.log(`服务器已启动，端口：${appConfig.listenPort}`);
})