const os = require("os");
const fs = require('fs');
const path = require('path');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser')
const session = require('express-session');

app.use(require('express').static(__dirname + '/public'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({ secret: 'freego_2019', cookie: { maxAge: 60000 }}))
server.listen(3000, function(){
  console.log('express listening on *:3000');
});
// Access the session as req.session
app.get('/', function(req, res, next) {
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
  socket.on('world', (data) => console.log(data));
});

(function start_nginx() {
  const nginx = exec( `nginx` );
  console.log(`start nginx reverse proxy`);
  nginx.stdout.on('data', data => console.log(data));
  nginx.stderr.on('data', data => console.log(data));
  nginx.on('close', (code) => {
      console.log(`nginx exited with code ${code}`);
      // restart nginx
      setTimeout(() => start_nginx(), 2000);
  });
})();