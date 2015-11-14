var Backbone = require("backbone");


class Stack extends Backbone.Model {
  get defaults() {
    return {
      name: "unnamed",
      controller: null,
      cards: [],
      properties: {},
      area: null,
      face_up: true,
      deck: false
    }
  }

  initialize(options) {
    // TODO: add to the area they belong to
    this.listenTo(this, "change:area", function() {
      if (this.attributes.area) {
        this.attributes.area.get("stacks").add(this);
      }
    });

    if (this.attributes.area) {
      this.attributes.area.get("stacks").add(this);
    }
  }

  draw() {
    if (this.attributes.cards.length === 0) {
      throw new Error("Can't draw from an empty deck");
    }
    return this.attributes.cards.shift(); // pop from top
  }

  draw_all() {
    var cards = this.attributes.cards;
    this.attributes.cards = [];
    return cards;
  }

  top () {
    return this.attributes.cards[0];
  }

  bottom() {
    return this.attributes.cards[this.size()-1];
  }

  place_on_top(cards) {
    if(cards instanceof Array){
      for(var card in cards) {
        this.attributes.cards.unshift(card);
      }
    } else {
      this.attributes.cards.unshift(cards);
    }
  }

  place_on_bottom(cards) {
    if (cards instanceof Array){
      for(var card of cards) {
        this.attributes.cards.push(card);
      }
    } else {
      this.attributes.cards.push(cards);
    }
  }

  shuffle(){

  }

  size() {
    return this.attributes.cards.length;
  }
}

Stack.collection = Backbone.Collection.extend({model: Stack});

module.exports = Stack;
