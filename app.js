var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var reload = require("reload");

server.listen(8005);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

reload(server, app)
