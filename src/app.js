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
  
  var DIRECTIONS = [
    new Phaser.Point(-1,  0),
    new Phaser.Point( 1,  0),
    new Phaser.Point( 0, -1),
    new Phaser.Point( 0,  1)]
  
  var TestContext = util.extend(util.Contextual, 'TestContext', {
    game: util.contextAttr,
    top: util.contextAttr,
    onUpdate: util.contextAttr
  });
  
  var TestState = util.extend(TestContext, 'TestState', {
    constructor: function(game) {
      this.constructor$TestContext();
      this.game = game;
      this.top = this;
      this.onUpdate = new Phaser.Signal();
      
      this.selectionConstraint = null;
      this.mouseBody = null;
      this.wood = [];
    },
    create: function create() {
      this.game.physics.startSystem(Phaser.Physics.P2JS);
      this.game.physics.p2.gravity.y = 100;
      this.wood.push(this.create$TestContext(Wood, 'tilemap/test'));
      this.wood.push(this.create$TestContext(Flame));
      this.mouseBody = this.game.physics.p2.createBody(0, 0, 0, true);
      
      this.game.input.addMoveCallback(function(pointer) {
        this.mouseBody.reset(pointer.position.x, pointer.position.y);
      }, this)
      
      this.game.input.onDown.add(function(pointer) {
        var bodies = this.game.physics.p2.hitTest(pointer.position, this.getWoodBodies());
        if(bodies.length > 0) {
          var body = bodies[0];
          var local = [0, 0];
          body.toLocalFrame(local, [this.game.physics.p2.pxmi(pointer.position.x), this.game.physics.p2.pxmi(pointer.position.y)]);
          local = [this.game.physics.p2.mpxi(local[0]), this.game.physics.p2.mpxi(local[1])];
          this.selectionConstraint = this.game.physics.p2.createLockConstraint(this.mouseBody, body, local);
        }
      }, this);
      this.game.input.onUp.add(function() {
        this.game.physics.p2.removeConstraint(this.selectionConstraint);
        this.selectionConstraint = null;
      }, this);
    },
    update: function update() {
      this.onUpdate.dispatch();
      var deadWood = this.wood.filter(function(wood) {
        return wood.dead;
      });
      for(var i=0; i<deadWood.length; i++) {
        var wood = deadWood[i].kill();
      }
    },
    getWoodBodies : function getWoodBodies() {
      return this.wood.map(function(wood) {
          return wood.sprite.body;
      });
    }
  });
  
  var Wood =  util.extend(TestContext, 'Wood', {
    constructor: function Wood(tilemapKey) {
      this.dirty = false;
      this.goesOut = true;
      this.dead = false;
      
      var tilemap = this.top.cache.getJSON(tilemapKey);
      this.tilewidth = tilemap.tilewidth;
      this.tileheight = tilemap.tileheight;
      this.mapwidth = tilemap.width;
      this.mapheight = tilemap.height;
      this.tilemapData = new Uint8Array(tilemap.layers[0].data);
      
      this.texture = this.game.add.renderTexture(tilemap.width * tilemap.tilewidth, tilemap.height * tilemap.tileheight);
      this.sprite = this.game.add.sprite(0, 0, this.texture);
      this.game.physics.p2.enable(this.sprite);
      this.sprite.body.data.wood = this;
      
      this.refresh(true);
      this.sprite.body.reset(200, 200);
      this.onUpdate.add(this.update, this);
    },
    getTile: function getTile(x, y, value) {
      return this.tilemapData[y * this.mapwidth + x];
    },
    setTile: function setTile(x, y, value) {
      this.tilemapData[y * this.mapwidth + x] = value;
      this.dirty = true;
    },
    refresh: function refresh(force) {
      if(!force && !this.dirty) return;
      
      var tile = this.game.add.sprite(0, 0, 'image/fireOverlay', 1);
      tile.visible = false;
      this.texture.renderXY(tile, 0, 0, true);
      tile.visible = true;
      this.sprite.body.clearShapes();
      this.dead = true;
      
      var i = 0;
      for(var y=0; y<this.mapheight; y++) {
        for(var x=0; x<this.mapwidth; x++) {
          var index = this.tilemapData[i++];
          if(index) {
            tile.frame = index - 1;
            this.texture.renderXY(tile, x * this.tilewidth, y * this.tileheight, false);
            this.sprite.body.addRectangle(this.tilewidth, this.tileheight, 
              (x - this.mapwidth  / 2 + 0.5) * this.tilewidth, 
              (y - this.mapheight / 2 + 0.5) * this.tileheight);
            this.dead = false;
          }
        }
      }
      tile.parent.remove(tile);
      this.dirty = false;
    },
    update: function update() {
      for(var i=0; i<3; i++) {
        var pos = new Phaser.Point(this.game.rnd.integerInRange(0, this.mapwidth  - 1), 
                                   this.game.rnd.integerInRange(0, this.mapheight - 1));
        var tile = this.getTile(pos.x, pos.y);
        if(tile >= 3) {
          if(this.game.rnd.frac() < 0.2) { //burn more if already burning
            tile += 1;
            if(tile == 17) {
              if(this.goesOut) {
                tile = 0;
              } else {
                tile = 16;
              }
            }
            this.setTile(pos.x, pos.y, tile);
            
            if(this.game.rnd.frac() < 0.9) { //spread not non-burning tile
              var otherPos = Phaser.Point.add(pos, this.game.rnd.pick(DIRECTIONS));
              var otherTile = this.getTile(otherPos.x, otherPos.y);
              if(otherTile == 2) {
                this.setTile(otherPos.x, otherPos.y, 3);
              }
            }
            
            if(this.game.rnd.frac() < 0.1) {
              var point = pos
                .multiply(this.tilewidth, this.tileheight)
                .rotate(0, 0, this.sprite.body.angle)
                .add(this.sprite.position.x, this.sprite.position.y)
                .add(this.game.rnd.integerInRange(-10, 10), this.game.rnd.integerInRange(0, -50));
              
              var bodies = this.game.physics.p2.hitTest(point, this.top.getWoodBodies());
              if(bodies.length > 0 && bodies[0].wood) {
                var body = bodies[0];
                var wood = body.wood;
                var local = [0, 0];
                body.toLocalFrame(local, [this.game.physics.p2.pxmi(point.x), this.game.physics.p2.pxmi(point.y)]);
                local = [this.game.physics.p2.mpxi(local[0]),
                         this.game.physics.p2.mpxi(local[1])];
                local = [Math.floor((local[0] + wood.texture.width  / 2) / wood.tilewidth ), 
                         Math.floor((local[1] + wood.texture.height / 2) / wood.tileheight)];
                var value = wood.getTile(local[0], local[1]);
                if(value == 2) {
                  wood.setTile(local[0], local[1], 3);
                }
              }
            }
          }
        }
      }
      this.refresh();
    },
    kill: function kill() {
      this.onUpdate.remove(this.update, this);
      this.game.world.remove(this.sprite);
    }
  });
  
  var Flame = util.extend(Wood, 'Flame', {
    constructor: function Flame() {
      this.constructor$Wood('tilemap/flame');
      this.goesOut = false;
    }
  });

  return {
    setup: setup
  };
});