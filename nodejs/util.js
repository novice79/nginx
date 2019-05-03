const fs = require('fs');
const jwt = require('jsonwebtoken');
const request = require('request-promise-native');

function pad(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}
const now_str =
    (dt = new Date()) =>
        `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}.${pad(dt.getMilliseconds(), 3)}`
            .replace(/\b\d\b/g, '0$&');

console.logCopy = console.log.bind(console);
console.log = function (...args) {
    if (args.length) {
        this.logCopy(`[${now_str()}]`, ...args);
    }
};
// some thing like: rm -rf temp/
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
// some thing like: rm -rf temp/*
function clearDir(path) {
    fs.readdirSync(path).forEach((file, index) => {
        const curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
}
function getDirs(path = '/etc/letsencrypt/live/') {
    const dirs = [];
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path[path.length - 1] == '/' ? `${path}${file}` : `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                // dirs.push(curPath);
                dirs.push(file);
            }
        });
    }
    return dirs;
}
function delFile(fn) {
    if (fs.existsSync(fn)) {
        fs.unlinkSync(fn);
    }
}
function stringifyError(err, filter, space) {
    var plainObject = {};
    Object.getOwnPropertyNames(err).forEach(function (key) {
        plainObject[key] = err[key];
    });
    return JSON.stringify(plainObject, filter, space);
};
const pass = process.env.TOKEN_PASS || 'piaoyun_2019';
function sign_token_1h() {
    return jwt.sign({ name: 'piaoyun' }, pass, { expiresIn: '1h' });
}
function verify_token(token) {
    try {
        const decoded = jwt.verify(token, pass);
        return true;
    } catch (err) {
        return false;
    }
}
function get_ip_by_sock(sock) {
    // console.log('sock.handshake.address='+sock.handshake.address);
    let rip = sock.handshake.address;
    rip = sock.handshake.headers['x-forwarded-for'] || rip.substr(rip.lastIndexOf(":") + 1) || '127.0.0.1';

    //console.log(rip);
    return rip;
}
function get_ip_by_req(req) {
    let cli_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    cli_ip = Array.isArray(cli_ip) ? cli_ip[0] : cli_ip;
    if (cli_ip.indexOf(',') > 0) {
        cli_ip = cli_ip.substring(0, cli_ip.indexOf(','));
    }
    return cli_ip;
}
function get_myurl_by_req(req) {
    //depend on nginx config
    let host = req.headers['host'];
    let proto = req.headers['x-forwarded-proto'] || 'http';
    let port = req.headers['x-forwarded-port'];
    let url = `${proto}://${host}`
    if (port) url = url + `:${port}`
    // console.log(req.headers);
    // console.log(url);
    return url;
}
function get_myurl_by_sock(sock) {
    //depend on nginx config
    let host = sock.handshake.headers['host'];
    let proto = sock.handshake.headers['x-forwarded-proto'] || 'http';
    let port = sock.handshake.headers['x-forwarded-port'];
    let url = `${proto}://${host}`
    if (port) url = url + `:${port}`
    // console.log(sock.handshake.headers);
    // console.log(url);
    return url;
}
async function noty_login_fail(ip) {
    if (process.env.ACCESS_TOKEN) {
        try {
            const res = await request.post({
                url: 'http://f2b:7000',
                json: {
                    token: process.env.ACCESS_TOKEN,
                    ip
                }
            });
            if (res == 'invalid') {
                console.log('noty_login_fail failed');
            } else {
                console.log('noty_login_fail success');
            }
        } catch (err) {
            console.log('noty_login_fail failed');
        }
    }
}
process.on('uncaughtException', (err) => {
    console.log('uncaughtException: ', err);
    const err_str = stringifyError(err, null, 4);
    console.error(err_str);
});
module.exports = {
    deleteFolderRecursive,
    clearDir,
    getDirs,
    delFile,
    sign_token_1h,
    verify_token,
    noty_login_fail,
    get_ip_by_sock,
}