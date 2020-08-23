import * as menu from './menu.js';
import * as fire from './fire.js';
import * as common from './common.js';
import * as util from '/lib/util.js';

export function init() {
  var game = new Phaser.Game({
    width: 600,
    height: 400,
    canvasID: 'display',
    parent: 'gameContainer',
    renderer: Phaser.AUTO,
    state: new util.BootState('play')
  });
  game.state.add('play', new PlayState(game));
  return game;
}

var PlayState = util.extend(common.PlayContext, 'PlayState', {
  constructor: function PlayState(game) {
    this.constructor$PlayContext();
    this.game = game;
    this.top = this;
    this.fire = null;
    this.playMenu = null;
    this.money = 100;
    this.onUpdate = new Phaser.Signal();
  },
  create: function create() {
    this.game.physics.startSystem(Phaser.Physics.P2JS);
    this.game.physics.p2.gravity.y = 100;

    this.fire = this.create$PlayContext(fire.Fire);
    this.playMenu = this.create$PlayContext(menu.PlayMenu);
  },
  update: function update() {
    this.onUpdate.dispatch();
  },
  shutdown: function shutdown() {
    util.clearBitmapCache();
  }
});