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
const util = require('./util');
let cert2svr = {};
if (fs.existsSync("/etc/letsencrypt/cert2svr.json")) {
  
}
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
io.on('connection', function (socket) {
  socket.emit('hello', 'I am sock server')
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
      } else {
        // const cfg = nunjucks.render('index.html', { foo: 'bar' });
        // fs.writeFileSync(sql_init_file, cfg);
      }
    });
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