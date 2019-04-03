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
const record = "/etc/letsencrypt/cert2svr.json";
let cert2svr = {};
if (fs.existsSync(record)) {
  cert2svr = JSON.parse(fs.readFileSync(record, 'utf8'));
  for (const [domain, service] of Object.entries(cert2svr)) {
    if(service){
      const cfg = nunjucks.render('tmpl.conf', {domain, service});
      fs.writeFileSync(`/etc/nginx/conf.d/https/${domain}.conf`, cfg);
    }
  }
}
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
function update_record(domain, service) {
  cert2svr[domain] = service;
  fs.writeFileSync(record, JSON.stringify(cert2svr));
  io.emit('exist-certs', cert2svr);
}
io.on('connection', function (socket) {
  socket.emit('exist-certs', cert2svr);
  // for test
  // socket.emit('exist-certs', {'example.com':'127.0.0.1:8977'})
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
        update_record(data.domain, '');
      }
    });
  });
  socket.on('bind-service', data => {
    if(data.service){
      const cfg = nunjucks.render('tmpl.conf', data);
      fs.writeFileSync(`/etc/nginx/conf.d/https/${data.domain}.conf`, cfg);
    } else {
      execSync(`rm -f /etc/nginx/conf.d/https/${data.domain}.conf`);
    }
    update_record(data.domain, data.service);
    execSync('service nginx reload');
    socket.emit('svr-back', '绑定服务成功');
  });
});

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