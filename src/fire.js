base.registerModule('fire', function() {
  var util = base.importModule('util');
  var common = base.importModule('common');
  
  var Fire = util.extend(common.PlayContext, 'Fire', {
    constructor: function Fire() {
      this.constructor$PlayContext();
      this.burnables = [];
      this.selectionConstraint = null;
      this.selectionBurnable = null;
      
      this.flameTexture1 = this.game.add.renderTexture(this.game.width, this.game.height);
      this.flameTexture2 = this.game.add.renderTexture(this.game.width, this.game.height);
      this.flameSprite = this.game.add.sprite(0, 0, this.flameTexture1);
      this.flameSprite.alpha = 0.9;
      
      this.group = this.game.add.group(undefined, 'fire');
      //this.terrain = this.create(Terrain, this.game.width / 2, this.game.height / 2, 'tilemap/terrain');
      this.mouseBody = this.game.physics.p2.createBody(0, 0, 0, true);
      
      this.game.input.addMoveCallback(function(pointer) {
        this.mouseBody.reset(pointer.position.x, pointer.position.y);
      }, this)
      
      this.game.input.onDown.add(function(pointer) {
        this.top.playMenu.onClick(pointer);
        if(!this.top.playMenu.menuClicked) {
          var bodies = this.collideBurnables(pointer.position);
          if(bodies.length > 0) {
            this.grab(bodies[0], pointer.position);
          }
        }
      }, this);
      this.game.input.onUp.add(function(pointer) {
        this.top.playMenu.canvg.Mouse.events.push({ type: 'onrelease', x: pointer.position.x, y: pointer.position.y,
					run: function(e) {},
          burnable: this.selectionBurnable
				});
        this.ungrab();
      }, this);
      
      this.onUpdate.add(this.update, this);
    },
    update: function update() {
      var deadChildren = this.burnables.filter(function(burnable) {
        return burnable.dead;
      });
      for(var i=0; i<deadChildren.length; i++) {
        var child = deadChildren[i];
        if(child == this.selectionBurnable) {
          this.ungrab();
        }
        child.kill();
        this.burnables.splice(this.burnables.indexOf(child), 1);
      }
      
      var matrix = new Phaser.Matrix(1, 0, 0, 0.9, 0, -1);
      var currentTexture = this.flameSprite.texture;
      var otherTexture = currentTexture == this.flameTexture1 ? this.flameTexture2 : this.flameTexture1;
      for(var i=0; i<this.burnables.length; i++) {
        var burnable = this.burnables[i];
        if(burnable.catchesFire) {
          otherTexture.renderXY(burnable.sprite, burnable.sprite.position.x, burnable.sprite.position.y);
        }
      }
      otherTexture.render(this.flameSprite, matrix);
      currentTexture.clear();
      this.flameSprite.setTexture(otherTexture);
    },
    getBurnableBodies: function getBurnableBodies() {
      return this.burnables.map(function(burnable) {
          return burnable.sprite.body;
      });
    },
    collideBurnables: function getBurnableCollisions(point) {
      return this.game.physics.p2.hitTest(point, this.getBurnableBodies());
    },
    addBurnable: function addBurnable(burnable) {
      this.burnables.push(burnable);
    },
    //from http://phaser.io/examples/v2/p2-physics/pick-up-object
    grab: function grab(body, position) {
      this.ungrab();
      var local = common.localizePoint(body, position, this.game);
      this.selectionConstraint = this.game.physics.p2.createLockConstraint(this.mouseBody, body, local);
      this.selectionBurnable = body.burnable || body.data.burnable;
    },
    ungrab: function ungrab() {
      if(this.selectionConstraint) {
        this.game.physics.p2.removeConstraint(this.selectionConstraint);
        this.selectionConstraint = null;
        this.selectionBurnable = null;
      }
    }
  });
  
  var Physical = util.extend(common.PlayContext, 'Physical', {
    constructor: function Physical(x, y, tilemapKey, imageKey, parent) {
      parent = parent || this.parent.group;
      this.constructor$PlayContext();
      this.dirty = false;
      this.dead = false;
      
      var tilemap = this.top.cache.getJSON(tilemapKey);
      this.tilewidth = tilemap.tilewidth;
      this.tileheight = tilemap.tileheight;
      this.mapwidth = tilemap.width;
      this.mapheight = tilemap.height;
      this.tilemapData = new Uint8Array(tilemap.layers[0].data);
      this.templateImage = this.top.cache.getImage(imageKey);
      
      this.texture = util.createBitmap(this.game, tilemap.width * tilemap.tilewidth, tilemap.height * tilemap.tileheight);
      this.sprite = this.game.add.sprite(0, 0, this.texture, undefined, parent);
      this.game.physics.p2.enable(this.sprite);
      this.sprite.body.debug = true;
      
      this.refresh(true);
      this.sprite.body.reset(x, y);
    },
    getTile: function getTile(x, y, value) {
      return this.tilemapData[y * this.mapwidth + x];
    },
    setTile: function setTile(x, y, value) {
      if(this.getTile(x, y) != value) {
        this.tilemapData[y * this.mapwidth + x] = value;
        this.dirty = true;
      }
    },
    refresh: function refresh(force) {
      if(!force && !this.dirty) return;
      
      this.texture.ctx.drawImage(this.templateImage, 0, 0);
      this.texture.dirty = true;
      this.sprite.body.clearShapes();
      this.dead = true;
      
      var i = 0;
      var rects = [];
      for(var y=0; y<this.mapheight; y++) {
        for(var x=0; x<this.mapwidth; x++) {
          var index = this.tilemapData[i++];
          if(index) {
            this.dead = false;
            
            var rect = {
              x: x,
              y: y,
              width: 1,
              height: 1
            }
            //the following is what I think the antichamber block algorithm might be doing
            //refer to the room where one can the digitalized boxes
            var joined = true;
            var everJoined = false;
            while(joined) {
              joined = false;
              for(var k=0; k<rects.length; k++) {
                var other = rects[k];
                if(rect.height == other.height && rect.y == other.y && 
                    (rect.x + rect.width == other.x || other.x + other.width == rect.x)) {
                  other.x = Math.min(rect.x, other.x);
                  other.width = rect.width + other.width;
                  rect = other;
                  joined = true;
                } else if(rect.width == other.width && rect.x == other.x &&
                    (rect.y + rect.height == other.y || other.y + other.height == rect.y)) {
                  other.y = Math.min(rect.y, other.y);
                  other.height = rect.height + other.height;
                  rect = other;
                  joined = true;
                }
                if(joined) {
                  everJoined = true;
                  rects.splice(rects.indexOf(rect), 1);
                  break;
                }
              }
            }
            rects.push(rect);
          } else {
            this.texture.ctx.clearRect(x * this.tilewidth, y * this.tileheight, this.tilewidth, this.tileheight);
          }
        }
      }
      for(i=0; i<rects.length; i++) {
        rect = rects[i];
        var width = rect.width * this.tilewidth;
        var height = rect.height * this.tileheight;
        var centerX = rect.x + rect.width  / 2;
        var centerY = rect.y + rect.height / 2
        this.sprite.body.addRectangle(width, height, 
              (centerX - this.mapwidth  / 2) * this.tilewidth, 
              (centerY - this.mapheight / 2) * this.tileheight);
      }
      this.dirty = false;
    },
  })
  
  var Burnable = util.extend(Physical, 'Burnable', {
    constructor: function Burnable(x, y, tilemapKey, imageKey) {
      this.constructor$Physical(x, y, tilemapKey, imageKey);
      this.goesOut = true;
      this.catchesFire = true;
      this.cooks = false;
      this.sprite.body.data.burnable = this;
      this.onUpdate.add(this.update, this);
    },
    update: function update() {
      if(this.catchesFire) {
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
            }
              
            if(this.game.rnd.frac() < 0.9) { //spread not non-burning tile
              var otherPos = Phaser.Point.add(pos, this.game.rnd.pick(common.DIRECTIONS));
              var otherTile = this.getTile(otherPos.x, otherPos.y);
              if(otherTile == 2) {
                this.setTile(otherPos.x, otherPos.y, 3);
              }
            }
            var point;
            if(this.game.rnd.frac() < 0.1) { //spread to other burnables
              point = pos
                .multiply(this.tilewidth, this.tileheight)
                .rotate(0, 0, this.sprite.body.rotation)
                .add(this.sprite.position.x, this.sprite.position.y)
                .add(this.game.rnd.integerInRange(-10, 10), this.game.rnd.integerInRange(0, -50));
              
              var bodies = this.fire.collideBurnables(point);
              if(bodies.length > 0 && bodies[0].burnable) {
                var body = bodies[0];
                var burnable = body.burnable;
                var local = common.localizePoint(body, point, this.game);
                local = [Math.floor((local[0] + burnable.texture.width  / 2) / burnable.tilewidth ), 
                         Math.floor((local[1] + burnable.texture.height / 2) / burnable.tileheight)];
                var value = burnable.getTile(local[0], local[1]);
                if(value == 2 || burnable.cooks) {
                  burnable.setTile(local[0], local[1], value + 1);
                }
              }
            }
          }
        }
        this.refresh();
      }
    },
    kill: function kill() {
      this.onUpdate.remove(this.update, this);
      this.sprite.destroy();
    },
    value: function value() {
      return 0;
    },
    cost: function cost() {
      return 2;
    }
  });
  
  var MIN_COOK = 5;
  var MAX_COOK = 10;
  
  var Food = util.extend(Burnable, 'Food', {
    constructor: function(x, y, tilemapKey) {
      this.constructor$Burnable(x, y, tilemapKey);
      this.goesOut = false;
      this.catchesFire = false;
      this.cooks = true;
    },
    value: function value() {
      var value = 0;
      for(var y=0; y<this.mapheight; y++) {
        for(var x=0; x<this.mapwidth; x++) {
          var tile = this.getTile(x, y);
          console.log(tile);
          if(MIN_COOK < tile && tile < MAX_COOK) {
            value++;
          }
        }
      }
      return value;
    }
  });
  
  var Flame = util.extend(Burnable, 'Flame', {
    constructor: function Flame(x, y) {
      this.constructor$Burnable(x, y, 'tilemap/flame', 'image/log');
      this.goesOut = false;
    }
  });
  
  var Terrain = util.extend(Physical, 'Terrain', {
    constructor: function Terrain(x, y, tilemapKey) {
      this.constructor$Physical(x, y, tilemapKey, this.game.world);
      this.sprite.body.kinematic = true;
    }
  });
  
  return {
    Fire: Fire,
    Burnable: Burnable,
    Food: Food,
    Flame: Flame
  }
});