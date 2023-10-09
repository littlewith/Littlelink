const sqlite = require('sqlite3').verbose()

// 创建或打开数据库文件（如果不存在，则创建）
const db = new sqlite.Database('../database/littlelink.db', (err) => {
    if (err) {
        console.error('Failed to open the database:', err.message);
    } else {
        db.run("CREATE TABLE IF NOT EXISTS `routes` (`id` INTEGER PRIMARY KEY,`expire_time` DATETIME NULL DEFAULT NULL,`new_path` TEXT NULL,`raw_path` TEXT NULL);");
        console.log('Connected to the database');
    }
});

//自动运维操作
const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000;
setInterval(cleanExpireRecord, twelveHoursInMilliseconds);

function closedb() {
    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        } else {
            console.log('Database connection closed');
        }
    });
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function formatDateTime(expire_time) {
    let now_date = new Date();
    let date = new Date(now_date.getTime() + expire_time * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

function generateRandomStringWithTimestamp() {
    let length = Math.floor(Math.random() * 20) + 1;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const timestamp = (new Date()).getTime();

    for (let i = 0; i < length; i++) {
        const randomIndex = (timestamp + i) % characters.length;
        result += characters.charAt(randomIndex);
    }
    result = result.toLowerCase();

    return '/' + result;
}

function writeroute(expire_time, raw_path) {
    timestr = formatDateTime(expire_time)
    let path = generateRandomStringWithTimestamp()
    let sql = "INSERT INTO `routes` (`new_path`,`raw_path`,`expire_time`) VALUES ('" + path + "','" + raw_path + "','" + timestr + "');";
    try {
        db.run(sql)
        return path;
    } catch {
        console.log("write route err!");
        return "null";
    }
}

function runsql(sql) {
    db.all('sql', (err, rows) => {
        if (err) {
            console.error('Error querying the database:', err);
            return "null";
        } else {
            console.log('Query result:', rows);
            return rows;
        }
    })
}

function getRawPath(path) {
    sql = "SELECT `raw_path` FROM routes WHERE `new_path` = '" + path + "'and expire_time > DATETIME('now');";
    //console.log(sql);
    let raw_path = null;
    return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err); // 如果出现错误，将错误传递给 Promise 的 reject
            } else {
                resolve(rows); // 如果成功，将查询结果传递给 Promise 的 resolve
            }
        });
    });
}

//清理失效记录
function cleanExpireRecord() {
    sql = "DELETE FROM `routes` WHERE expire_time < DATETIME('now');"
    db.run(sql);
    console.log("Expired Record cleaned!");
}

//console.log(writeroute(2, "https://baidu.com"))

module.exports = {
    writeroute: writeroute,
    getRawPath: getRawPath,
}