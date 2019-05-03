const fs = require('fs');

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
    if(fs.existsSync(path)){
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path[path.length-1] == '/' ? `${path}${file}` : `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) { 
                dirs.push(curPath);
            } 
        });
    }
    return dirs;
}
function delFile(fn){
    if( fs.existsSync(fn) ){
        fs.unlinkSync(fn);
    }
}
module.exports = {
    deleteFolderRecursive,
    clearDir,
    getDirs,
    delFile
}