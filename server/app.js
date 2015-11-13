var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var reload = require("reload");
var Backbone = require("backbone");
var _ = require('underscore');
var log = require("debug")("game");

server.listen(8005);

app.use('/bower', express.static(__dirname + '/../bower_components'));
app.use('/assets', express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


var game = new Backbone.Model();
var players = new Backbone.Collection();

io.on('connection', function (socket) {

  // a player wants to join
  socket.on('player', function (data) {
    log("player wants to connect", data);
    socket.emit("player", data);

    if (players.length === 0) {
      log("player added as host, game starting");
      // establish host
      data.host = true;
      socket.player = players.add(data);
      socket.player = players.add(data);

      // start game
      game.set({
        host: socket.player.toJSON(),
        status: "open",
        players: players.toJSON()
      });
    } else if (game.get("status") == "open") {
      // add to the game
      players.add(data);
      log("player added to game", players.length);

      game.set({
        players: players.toJSON()
      });
    } else {
      // you can't join, but here is the game
      log("player rejected, game isn't open");
      socket.emit("game", game.toJSON());
    }
  });

  socket.on('disconnect', function() {
    if (socket.player && socket.player.attributes.host) {
      // TODO: reassign host instead
      players.reset([]);
      game.reset({status: "pending"});
      log("host disconnected, resetting game", players.length);
      io.emit("game:end");
    } else {
      players.remove(socket.player);
      log("player disconnected", players.length);
    }
  });
});

events = _.extend({}, Backbone.Events);
events.listenTo(game, "change", function() {
  log("game changed, updating clients");
  io.emit("game", game.toJSON());
});



reload(server, app, 500, true);
