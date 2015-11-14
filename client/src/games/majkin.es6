var log = require("debug")("majkin");
var queue = require("queue");
var _ = require("underscore");

var BaseGame = require("./base");
var Card = require("../models/card");
var CardList = require("../models/card_list");


class MajkinGame extends BaseGame {
  start() {
    // generate arbitrary cards
    var cards = new Card.collection(require("json!../resources/cards.json"));
    var central_area = this.areas.add({name: "central_deck", default: true});

    cards.reset(cards.shuffle(), {slient: true});

    var weapons = new Card.collection(require("json!../resources/weapons.json"));

    this.card_lists.add({
      area: central_area,
      name: "central_deck",
      cards: cards,
      face_up: false,
      deck: true
    });
    this.card_lists.add({
      area: central_area,
      name: "weapon_deck",
      cards: weapons,
      face_up: true,
      deck: true
    });
    this.card_lists.add({
      area: central_area,
      name: "discard_pile",
      face_up: true,
      deck: true
    });

    $('#prompt-button').hide();
    $('#start-button').click(() => {
      $('#start-button').hide();
      $('#prompt-button').show();
      this.play();
    });
  }

  setupPlayers() {
    log("setting up players");

    // deal everyone a single card face up from central deck
    for (var player of this.players.models) {
      if (!player.get("area")) {
        log("setting up player", player.id);
        var area = this.areas.add({
          player: player,
          player_id: player.id
        });

        player.set({
          area: area,
          enemy_card_list: this.card_lists.add({
            area: area,
            name: "enemy_creature",
            controller_id: player.id,
            face_up: true,
            deck: false
          }),
          player_card_list: this.card_lists.add({
            area: area,
            name: "player_creature",
            controller: player,
            controller_id: player.id,
            face_up: true,
            deck: false
          }),
          player_hand: this.card_lists.add({
            area: area,
            name: "player_hand",
            controller: player,
            controller_id: player.id,
            face_up: true,
            hand: true,
            deck: false
          })
        });

        // scroll to players area
        if (player.me) {
          log("scrolling to player");
          area = $(`#player-areas [data-player=${player.id}]`);
          $("#player-areas .list").css({
            left: `-${area.position().left}px`
          });
        }
      }
    }
  }

  play() {
    log("playing");
    for (var player of this.players.models) {
      log(`dealing to player ${player.attributes.name}`);
      var drawn_card = this.central_deck().draw();
      var card_list = this.player_creature(player);
      card_list.place_on_top(drawn_card);

      var card = this.weapon_deck().draw();
      // player.attributes.hand.place_on_bottom(card);
      this.player_hand(player).place_on_bottom(card);
    }

    var q = queue({concurrency: 1});
    q.push(this.queueTurns.bind(this, q));
    q.start();
  }

  queueTurns(q, cb) {
    this.players.models.forEach((player) => {
      q.push((cb) => {
        this.turn(player, (winner) => {
          if (winner) {
            console.log("WE HAVE A WINNER!", winner);
            for(var x=0; x<q.length; x++) {
              q.pop();
            }
          }
          cb();
        });
      });
    });

    q.push((cb) => {
      console.log("turn ended");
      _.delay(() => {
        this.queueTurns(q, cb);
      }, 1000);
    });

    cb();
  }

  turn(player, cb) {
    console.log("turn("+player+")");
    // if monster deck is empty
    if (this.central_deck().size() <= 0) {
      log("fliping discard pile");
      this.central_deck().place_on_bottom(
        this.discard_pile().shuffle().draw_all()
      );
    }

    // deal the enemy
    var enemy_card_list = this.enemy_creature(player);
    var enemy_creature = this.central_deck().draw();
    enemy_creature.set({faceup: false});
    enemy_card_list.place_on_top(enemy_creature);

    _.delay(() => {
      // reveal the enemy
      log("enemy revealed", enemy_creature);
      enemy_creature.set({faceup: true});

      // give time to react
      var $pass_button = $('#pass-button');
      var $item_button = $('#item-button');
      console.log(player.id, game.player.id);
      if (player.me) {
        $pass_button.show();
        if(this.player_hand(player).size()){
          $item_button.show();
        }
      } else {
        $pass_button.hide();
        $item_button.hide();
        log("some other players turn");
      }

      this.countdown(15, () => {
        this.fight(player, 0, cb);
        $pass_button.hide();
        $item_button.hide();
      }, 10000);

      $pass_button.off().click(() => {
        console.log("clearTimeout("+this.countdown_delay_id+")");
        clearTimeout(this.countdown_delay_id);
        this.fight(player, 0, cb);
        $pass_button.hide();
        $item_button.hide();
      });

      $item_button.off().click(() => {
        console.log("clearTimeout("+this.countdown_delay_id+")");
        clearTimeout(this.countdown_delay_id);
        var item = this.player_hand(player).draw();
        this.fight(player, item.attributes.lvl, cb);
        $pass_button.hide();
        $item_button.hide();
      });
    }, 1000);
  }

  countdown(seconds, callback) {
    $('#pass-button').find('#countdown').text(seconds);
    if (seconds > 0) {
      this.countdown_delay_id = _.delay(() => {
        this.countdown(seconds - 1, callback)
      }, 1000);
    } else {
      callback();
    }
  }

  fight(player, item_bonus, cb){
    // if player level + player monster level >= deck monster level
    var winner = null;
    var enemy_card_list = this.enemy_creature(player);
    var enemy_creature = enemy_card_list.top();

    var player_card_list = this.player_creature(player);
    if (player_card_list) {
      var player_creature = player_card_list.top();
      var player_level = player_creature.attributes.lvl + item_bonus;
      var enemy_level = enemy_creature.attributes.lvl;
      if (enemy_level <= player_level) {
        // player creature gains a level
        var new_level = player_creature.attributes.lvl+1;
        player_creature.set({lvl: new_level});
        log("player was victorious!", player.id);
        if (player_creature.attributes.lvl >= 10){
          // end game
          winner = player;
        }
      } else {
        log("player was defeated", player_creature.attributes.lvl, enemy_level);
      }
    } else {
      log("player is missing a monster", player.attributes.name);
    }

    _.delay(() => {
      // put enemy monster in discard pile
      this.discard_pile().place_on_bottom(
        enemy_card_list.draw_all()
      );
      cb(winner);
    }, 1000);
  }

  central_deck() {
    return this.card_lists.findWhere({name: "central_deck"});
  }

  weapon_deck() {
    return this.card_lists.findWhere({name: "weapon_deck"});
  }

  discard_pile() {
    return this.card_lists.findWhere({name: "discard_pile"});
  }

  enemy_creature(player) {
    return this.card_lists.findWhere({
      name: "enemy_creature",
      controller_id: player.id
    });
  }

  player_creature(player) {
    return this.card_lists.findWhere({
      name: "player_creature",
      controller_id: player.id
    });
  }

  player_hand(player) {
    return this.card_lists.findWhere({
      name: "player_hand",
      controller_id: player.id
    });
  }
}

module.exports = MajkinGame;
