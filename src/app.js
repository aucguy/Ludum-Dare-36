base.registerModule('app', function() {
  var menu = base.importModule('menu');
  var fire = base.importModule('fire');
  var common = base.importModule('common');
  var util = base.importModule('util');
  
  var setup = {
    /**
     * load the assets
     */
    loadAssets: function loadAssets(main) {
    },
    /**
     * create the states
     */
    getStates: function getStates(main) {
      return {
        play: new PlayState(main.game)
      };
    },
    /**
     * initialize the application
     */
    initApp: function initApp(main) {
      main.game.state.start('play');
    }
  };
  
  var PlayState = util.extend(common.PlayContext, 'TestState', {
    constructor: function PlayState(game) {
      this.constructor$PlayContext();
      this.game = game;
      this.top = this;
      this.fire = null;
      this.playMenu = null;
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
    }
  });

  return {
    setup: setup
  };
});