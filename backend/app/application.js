//express主框架
const express = require('express');
//解析body的组件
const bodyParser = require('body-parser');
//日志组件
const morgan = require('morgan');
//限流组件，用于缓解ddos
const rateLimit = require('express-rate-limit');
//数据库配置
const db = require('../database/database');
//静态资源解析
const mime = require("mime");
const path = require("path");
//同源策略

//服务器配置---------------------------------------------------------------------
//限流配置
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 100, // 最多6个请求
});

//服务器
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(morgan('combined'));
app.use(limiter);

//配置有效时间hour
const eff_time = 24;

//预防sql注入
function sanitizeInput(input) {
    // 移除特殊字符
    const sanitizedInput = input.replace(/[;'"\\]/g, '');

    return sanitizedInput;
}

//路由部分--------------------------------------------------------------------------

//路由拦截中间件
const routerFetcher = (req, res, next) => {
    const ext = path.extname(req.url);
    const mimeType = mime.getType(ext);
    if (mimeType) {
        res.setHeader('Content-Type', mimeType);
    }
    if (req.path == "/") {
        next();
        return
    } else if (req.path == "/addpath/ensure") {
        next();
    } else if (req.path == "/favicon.ico") {
        next();
    } else if (req.path == "/assets") {
        next();
    } else {
        db.getRawPath(req.path).then(rows => {
            res.redirect(rows[0]['raw_path']);
        }).catch(err => {
            console.log("Bad link!");
            next();
        });
    }
}

app.use(routerFetcher);

app.use("/", express.static("../../front/LittleLink/dist"));

app.post("/addpath/ensure", urlencodedParser, function (req, res) {
    console.log(req.body);
    let raw_path = req.body.rawpath;

    let new_path = db.writeroute(eff_time, raw_path);
    res.json({
        "msg": "ok",
        "link": new_path,
    })
})


// 添加一个错误处理中间件来捕获未知路由
app.use((req, res) => {

    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="3;url=/">
  <title>页面未找到</title>
</head>
<body>
  <h3>对不起，您请求的页面不存在。将在3秒后返回主页。</h3>
  <p>如果没有自动跳转，请点击 <a href="/">这里</a>。</p>
</body>
</html>
  `;

    // 设置HTTP状态码为404
    res.status(404);

    // 发送自定义404页面
    res.setHeader('Content-Type', 'text/html');

    // 发送HTML代码作为响应
    res.send(htmlContent);
});

//启动
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})