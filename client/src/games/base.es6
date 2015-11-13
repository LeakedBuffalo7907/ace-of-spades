var Backbone = require("backbone");
var _ = require("underscore");
var store = require("store");
var log = require("debug")("base-game");

var Stack = require("../models/stack");
var Player = require("../models/player");


class BaseGame extends Backbone.Model {
  get defaults() {
    return {
      host: null,
      status: "pending",
      players: []
    };
  }

  constructor(app) {
    super();
    log("game is starting");
    this.app = app;
    this.socket = app.socket;
    this.players = new Backbone.Collection({model: Player});
    this.stacks = new Backbone.Collection({model: Stack});

    // connection properties
    this.setupWebsocketEvents(this.socket);

    // TODO: download current collections
    // TODO: listen for connecting players
    // TODO: add the players to the players Collection
    // TODO: show the players on screen
    this.listenTo(this.players, "all", function(event, model) {
      // window.app.socket.send(event,
    });
    this.listenTo(this, "change:players", function(e) {
      log("game players updated");
      this.players.set(this.attributes.players);
    });

    // get or create the current player
    this.player = new Player();

    // TODO: detect if the game is on

    // connecting to server
    log("player is trying to connect");
    this.socket.emit("player", this.player.toJSON());
  }

  setupWebsocketEvents(socket) {
    var game = this;
    socket.on("player", function(data) {
      console.log("player", data);
    });
    socket.on("game", function(data) {
      console.log("game", data);
      game.set(data);
    });
  }

  /**
   * this is called when the host starts the game
   * This will lock the players array
   */
  start() {
    initialize();
    this.trigger(this, "game:started");
  }

  initialize() {
    // do game rules

  }
}

module.exports = BaseGame;
