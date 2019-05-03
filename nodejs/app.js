const os = require("os");
const fs = require('fs');
const { spawn, spawnSync, exec, execSync } = require('child_process');
const path = require('path');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser')
const session = require('express-session');
const nunjucks = require('nunjucks');
const CronJob = require('cron').CronJob;
const util = require('./util');
const record = "/etc/letsencrypt/services.json";
let services = {};
// 1st of every month at 3 am
const job = new CronJob('0 0 3 1 * *', () => {
  const exe_log = execSync('letsencrypt renew').toString().trim();
  console.log(exe_log);
  execSync('service nginx reload');
}, null, false, 'Asia/Shanghai');
job.start();
nunjucks.configure(__dirname + '/views', { autoescape: true });
app.use(require('express').static(__dirname + '/public'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(session({ secret: 'freego_2019', cookie: { maxAge: 60000 } }))
server.listen(3000, function () {
  console.log('express listening on *:3000');
});
// Access the session as req.session
app.get('/test', function (req, res, next) {
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } else {
    req.session.views = 1
    res.end('welcome to the session demo. refresh!')
  }
});
function update_record(data) {
  // {
  //   protocol: this.protocol,
  //   svr_domain: this.svr_domain || 'default',
  //   svr_path: this.sv_path || '/',
  //   inner_svr: this.inner_svr,
  // }
  const url = `${data.protocol}://${data.svr_domain}${svr_path}`;
  services[url] = data;
  fs.writeFileSync(record, JSON.stringify(services));
  io.emit('exist-svrs', services);
}
io.on('connection', function (socket) {
  socket.emit('exist-svrs', services);
  socket.emit('exist-certs', util.getDirs() );
  // for test
  // socket.emit('exist-svrs', {'example.com':'127.0.0.1:8977'})
  socket.on('req-cert', data => {
    console.log(data);
    const le = spawn('letsencrypt', ['certonly', '--webroot', '-w', '/var/www/ssl-proof/', '--agree-tos', '--email', data.email, '-d', data.domain]);
    le.stdout.on('data', output => {
      socket.emit('le-feedback', output.toString())
      console.log(`le stdout: ${output}`);
    });

    le.stderr.on('data', (output) => {
      socket.emit('le-feedback', output.toString())
      console.log(`le stderr: ${output}`);
    });

    le.on('close', (code) => {
      if (code !== 0) {
        console.log(`le process exited with code ${code}`);
        socket.emit('le-feedback', '申请SSL证书失败');
        
      } else {
        socket.emit('le-feedback', '申请SSL证书成功');
        socket.emit('exist-certs', util.getDirs() );
      }
    });
  });
  socket.on('bind-service', data => {
    // {
    //   protocol: this.protocol,
    //   svr_domain: this.svr_domain || 'default',
    //   svr_path: this.sv_path || '/',
    //   inner_svr: this.inner_svr,
    // }
    const cfg = nunjucks.render('path.conf', data);
    const fn = data.svr_path.replace(/\//gi, '_');
    if(data.svr_domain == 'default'){     
      fs.writeFileSync(`/etc/nginx/conf.d/default/${data.protocol}/${fn}.conf`, cfg);
    } else {
      const cd = `/etc/nginx/conf.d/${data.protocol}`;
      const cf = `${cd}/${data.svr_domain}.conf`;       
      if( !fs.existsSync(cf) ){
        const cfg = data.protocol == 'https' ? nunjucks.render('https.conf', data) : nunjucks.render('http.conf', data);
        fs.writeFileSync(`${cd}/${data.svr_domain}.conf`, cfg);
        fs.mkdirSync(`${cd}/${data.svr_domain}`, { recursive: true });
      }
      fs.writeFileSync(`${cd}/${data.svr_domain}/${fn}.conf`, cfg);
      if(data.protocol == 'https'){
        util.delFile(`/etc/nginx/conf.d/http/${data.svr_domain}/${fn}.conf`);
      } else {
        util.delFile(`/etc/nginx/conf.d/https/${data.svr_domain}/${fn}.conf`);
      }
    }
    update_record(data);
    execSync('service nginx reload');
    socket.emit('svr-back', '绑定服务成功');
  });
  socket.on('del-service', data => {
    const svr = services[data.addr];
    const fn = svr.svr_path.replace(/\//gi, '_');
    if(svr.svr_domain == 'default'){
      util.delFile(`/etc/nginx/conf.d/default/${svr.protocol}/${fn}.conf`);
    } else {
      util.delFile(`/etc/nginx/conf.d/${svr.protocol}/${svr.svr_domain}/${fn}.conf`);
    }
    execSync('service nginx reload');
    delete services[data.addr];
    fs.writeFileSync(record, JSON.stringify(services));
    io.emit('exist-svrs', services);
  });
});
if (fs.existsSync(record)) {
  services = JSON.parse(fs.readFileSync(record, 'utf8'));
  for (const [url, data] of Object.entries(services)) {
    const cfg = nunjucks.render('path.conf', data);
    const fn = data.svr_path.replace(/\//gi, '_');
    if(data.svr_domain == 'default'){     
      fs.writeFileSync(`/etc/nginx/conf.d/default/${data.protocol}/${fn}.conf`, cfg);
    } else {
      const cd = `/etc/nginx/conf.d/${data.protocol}`;
      const cf = `${cd}/${data.svr_domain}.conf`;       
      if( !fs.existsSync(cf) ){
        const cfg = data.protocol == 'https' ? nunjucks.render('https.conf', data) : nunjucks.render('http.conf', data);
        fs.writeFileSync(`${cd}/${data.svr_domain}.conf`, cfg);
        fs.mkdirSync(`${cd}/${data.svr_domain}`, { recursive: true });
      }
      fs.writeFileSync(`${cd}/${data.svr_domain}/${fn}.conf`, cfg);
    }
  }
}
(function start_nginx() {
  const nginx = exec(`nginx`);
  console.log(`start nginx reverse proxy`);
  nginx.stdout.on('data', data => console.log(data));
  nginx.stderr.on('data', data => console.log(data));
  nginx.on('close', (code) => {
    console.log(`nginx exited with code ${code}`);
    // restart nginx
    setTimeout(() => start_nginx(), 2000);
  });
})();