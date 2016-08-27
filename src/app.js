base.registerModule('app', function() {
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
        test: new TestState(main.game)
      };
    },
    /**
     * initialize the application
     */
    initApp: function initApp(main) {
      main.game.state.start('test');
    }
  };
  
  var TestContext = util.extend(util.Contextual, 'TestContext', {
    game: util.contextAttr,
    top: util.contextAttr
  });
  
  var TestState = util.extend(TestContext, 'TestState', {
    constructor: function(game) {
      this.constructor$TestContext();
      this.game = game;
      this.top = this;
      this.selectionConstraint = null;
      this.mouseBody = null;
      this.wood = [];
    },
    create: function create() {
      this.game.physics.startSystem(Phaser.Physics.P2JS);
      this.game.physics.p2.gravity.y = 100;
      this.wood.push(this.create$TestContext(Wood));
      this.mouseBody = this.game.physics.p2.createBody(0, 0, 0, true);
      
      this.game.input.addMoveCallback(function(pointer) {
        this.mouseBody.reset(pointer.position.x, pointer.position.y);
      }, this)
      
      this.game.input.onDown.add(function(pointer) {
        var bodies = this.game.physics.p2.hitTest(pointer.position, this.wood.map(function(wood) {
          return wood.sprite.body;
        }));
        if(bodies.length > 0) {
          var body = bodies[0];
          var local = [0, 0];
          body.toLocalFrame(local, [this.game.physics.p2.pxmi(pointer.position.x), this.game.physics.p2.pxmi(pointer.position.y)]);
          local = [this.game.physics.p2.mpxi(local[0]), this.game.physics.p2.mpxi(local[1])]
          this.selectionConstraint = this.game.physics.p2.createLockConstraint(this.mouseBody, body, local);
          var tile = this.game.add.sprite(0, 0, 'image/fireOverlay', 0);
          
          body.wood.texture.renderXY(tile, local[0] + body.wood.texture.width / 2, local[1] + body.wood.texture.height / 2);
          tile.parent.remove(tile);
        }
      }, this);
      this.game.input.onUp.add(function() {
        this.game.physics.p2.removeConstraint(this.selectionConstraint);
        this.selectionConstraint = null;
      }, this);
    }
  });
  
  var Wood =  util.extend(TestContext, 'Object', {
    constructor: function Wood() {
      var tilemap = this.top.cache.getJSON('tilemap/test');
      var tilemapData = new Uint8Array(tilemap.layers[0].data);
      this.texture = this.game.add.renderTexture(tilemap.width * tilemap.tilewidth, tilemap.height * tilemap.tileheight);
      this.sprite = this.game.add.sprite(0, 0, this.texture);
      var tile = this.game.add.sprite(0, 0, 'image/fireOverlay', 1);
      this.game.physics.p2.enable(this.sprite);
      this.sprite.body.clearShapes();
      this.sprite.body.debug = true;
      this.sprite.body.data.wood = this;
      
      var i = 0;
      for(var y=0; y<tilemap.height; y++) {
        for(var x=0; x<tilemap.width; x++) {
          if(tilemapData[i++]) {
            this.texture.renderXY(tile, x * tilemap.tilewidth, y * tilemap.tileheight);
            this.sprite.body.addRectangle(tilemap.tilewidth, tilemap.tileheight, 
              (x - tilemap.width / 2 + 0.5) * tilemap.tilewidth, (y - tilemap.height / 2 + 0.5) * tilemap.tileheight);
          }
        }
      }
      this.sprite.body.reset(200, 200);
      tile.parent.remove(tile);
    }
  })

  return {
    setup: setup
  };
});
