// const moment = require('moment');
const express = require('express');
const handleDB = require('../db/handleDB')
require('../utils/filter') // 只需要这个js文件里面的代码执行即可，无需其他操作
const common = require("../utils/common")
const constant = require("../utils/constant");

const router = express.Router();

// 测试cookie和session
router.get('/', (req,res)=>{
    // res.cookie("name", "node", {maxAge: 60 * 60 * 2 * 1000}) // maxAge的单位是毫秒
    // req.session["age"] = 12;
    // console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    
    (async function(){
        // 访问首页，判断是否登录
        let userInfo = await common.getUser(req, res);

        // 查询数据库，获取分类信息
        let result2;
        try {
            result2 = await handleDB(res, "info_category", "find", "查询数据库出错", ["name"])
        } catch (error) {
            console.log("查询分类信息失败");
        }
        
        // 获取首页右侧点击排行的数据
        let result3;
        // let result3 = await handleDB(res, "info_news", "sql", "查询数据库出错", "select * from info_news order by clicks desc limit 6")
        try {
            result3 = await handleDB(res, "info_news", "find", "查询数据库出错", "1 order by clicks desc limit 6")
        } catch (error) {
            console.log("查询点击排行的信息失败");
        }
       
        // 将用户信息、分类信息等数据传递到模板中去
        let data = {
            user_info: userInfo[0] ? { 
                nick_name: userInfo[0].nick_name, 
                avatar_url: userInfo[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + userInfo[0].avatar_url : "/news/images/worm.jpg"
            } : false,
            category: result2,
            newsClick: result3
        }
        res.render('news/index', data);
    })();
})

router.get('/news_list',(req,res)=>{
    (async function(){
        // 获取参数 cid(新闻分类ID) page(当前页数) per_page(每页条数)
        let {cid=1, page=1, per_page=5} = req.query;
        // 查询数据库 result为数组
        try {
            let wh = cid == 1 ? "1" : `category_id=${cid}`
            let result = await handleDB(res, "info_news", "limit", "数据库查询出错", {where: `${wh} order by create_time desc`, number:page, count:per_page})
            let total = await handleDB(res, "info_news", "sql", "数据库查询出错", `select count(*) from info_news where ${wh}`) // 计算总条数
            // console.log(total); // [ RowDataPacket { 'count(*)': 149 } ]
            let totalPage = Math.ceil(total[0]["count(*)"] / per_page);
            // console.log(totalPage); 
            // 把查询得到的数据返回给前端
            res.send({
                newsList:result,
                totalPage,
                currentPage: Number(page) // 接收过来的参数为字符串类型
            });
        } catch (error) {
            console.log("查询新闻详细内容错误");
        }
    })();
    
    
    

})

router.get('/get_cookie',(req,res)=>{
    res.send('cookie中name的值：'+ req.cookies['name'])
})
router.get('/get_session',(req,res)=>{
    res.send('session中age的值：'+req.session['age'])
})
// 测试查询数据库
router.get('/get_data',(req,res)=>{
    (async function(){
        let result = await handleDB(res, "info_category", "find", "数据库查询出错");
        res.send(result);
    })();
})



module.exports = router;