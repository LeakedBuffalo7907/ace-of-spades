var $ = require("jquery");
window.jQuery = $;
window.$ = $;

var _ = require("underscore");
var log = require("debug")("main");

var BaseView = require("./views/base");
var MajkinGame = require("./games/majkin");


class Main extends BaseView {
  get el() {
    return "body";
  }

  initialize(options) {
    log("starting main application");
    this.setupWebsockets();
    this.game = new MajkinGame(this);
  }

  setupWebsockets() {
    var socket = io.connect('http://localhost:8005');
    this.socket = socket;
    socket.on('news', function (data) {
      console.log(data);
      socket.emit('my other event', { my: 'data' });
    });
  }
}

window.Main = Main;
