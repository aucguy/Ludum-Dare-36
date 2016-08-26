base.registerModule('main', function() {
  var phaserInjector = base.importModule('phaserInjector');
  var util = base.importModule('util');
  var app = base.importModule('app');

  /**
   * entry point
   */
  function init() {
    Main.instance = new Main();
  }
  /**
   * big thing that controls everything
   */
  var Main = util.extend(Object, 'Main', {
    constructor: function Main() {
      var display = document.getElementById('display');
      display.parentElement.removeChild(display);
      var config = this.getPhaserConfig();
      config.state = new BootState(this);
      this.game = new Phaser.Game(config);
      this.app = app.setup;
      this.sounds = {};
    },
    getPhaserConfig: function getPhaserConfig() {
      return {
        width: 600,
        height: 400,
        canvasID: 'display',
        parent: 'gameContainer',
        renderer: Phaser.AUTO,
      };
    }
  });
  Main.instance = null;

  function onError() {
    var loadScreen = document.getElementById('loadScreen');
    loadScreen.parentNode.removeChild(loadScreen);
  }

  /**
   * intial state used to inject assets
   */
  var BootState = util.extend(Object, 'BootState', {
    constructor: function BootState(main) {
      this.main = main;
    },
    preload: function preload() {
      phaserInjector.injectIntoPhaser(this.main.game.load);
      this.main.app.loadAssets(this.main);

      var states = this.main.app.getStates(this.main);
      var names = Object.getOwnPropertyNames(states);
      for(var i=0; i<names.length; i++) {
        var name = names[i];
        var state = states[name];
        this.main.game.state.add(name, state);
      }
    },
    create: base.external(function create() {
      var names = Object.getOwnPropertyNames(this.main.game.cache._cache.sound);
      for(i=0; i<names.length; i++) {
        this.main.game.sound.decode(names[i]);
        this.main.sounds[names[i]] = this.main.game.sound.add(names[i]);
      }

      this.main.game.stage.backgroundColor = '#FFFFFF';
      var arrowKeys = [
        Phaser.KeyCode.LEFT,
        Phaser.KeyCode.RIGHT,
        Phaser.KeyCode.UP,
        Phaser.KeyCode.DOWN
      ];
      base.addEventListener(window, "keydown", function(event) {
        if(arrowKeys.indexOf(event.keyCode) != -1) {
          event.preventDefault();
        }
      });

      this.main.app.initApp(this.main);
    })
  });

  return {
    init: init,
    Main: Main
  };
});
