var bv = require("backbone_views");
var _ = require("underscore");


class CardListItem extends bv.DetailView {
  get tagName() {
    return "deck-element";
  }
  initialize() {
    this.listenTo(this.model, "change", function() {
      console.log("stack changed");
      this.render()
    });
    this.listenTo(this.model.get("card_lists"), "update", function() {
      console.log("cards changed");
      this.render()
    });
  }
  render() {
    var deck = this.el;
    var card = null;
    for(var x=0; x<this.model.get("cards").length; x++) {
      card = $("<card-element class='kung-fu' faceup='true'></card-element>").get(0)
      deck.add(card);
      card.flip();
    }
    return this;
  }
}


class PlayerAreaItemView extends bv.ListView {

  get itemViewClass() {
    return CardListItem;
  }

  get listSelector() {
    return "decks";
  }

  get template() {
    return _.template(`
      <div>AREA: <%- player_id %></div>
      <div class="decks">
      </div>
    `);
  }

  initialize(options) {
    this.collection = options.model.get("card_lists");
    super.initialize(options);
  }

  render(context) {
    if (! context) {
      context = {};
    }
    context.player = this.model.get("player");
    if (context.player) {
      context.player_id = context.player.id;
    } else {
      context.player_id = "central";
    }
    super.render(context);
    var player = this.model.get("player");
    if (player) {
      this.$el.attr("data-player", context.player_id);
    }

    // var numcards = Math.floor(Math.random() * 3) + 1;
    // var deck = this.$("deck-element").get(0);
    // for(var x=0; x<numcards; x++) {
    //   deck.add($("<card-element></card-element>").get(0));
    // }
    return this;
  }
}


class PlayerAreaListView extends bv.ListView {
  get itemViewClass() {
    return PlayerAreaItemView;
  }

  initialize(options) {
    this.collection = game.areas;
    super.initialize(options);
  }
}


module.exports = PlayerAreaListView;
