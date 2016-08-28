base.registerModule('fire', function() {
  var util = base.importModule('util');
  var common = base.importModule('common');
  
  var Fire = util.extend(common.PlayContext, 'Fire', {
    constructor: function Fire() {
      this.constructor$PlayContext();
      this.burnables = [];
      this.group = this.game.add.group(undefined, 'fire');
      this.burnables.push(this.create(Burnable, 'tilemap/test'));
      this.burnables.push(this.create(Flame));
      this.mouseBody = this.game.physics.p2.createBody(0, 0, 0, true);
      
      this.game.input.addMoveCallback(function(pointer) {
        this.mouseBody.reset(pointer.position.x, pointer.position.y);
      }, this)
      
      this.game.input.onDown.add(function(pointer) {
        this.top.playMenu.onClick(pointer);
        if(!this.top.playMenu.menuClicked) {
          var bodies = this.collideBurnables(pointer.position);
          if(bodies.length > 0) {
            var body = bodies[0];
            var local = [0, 0];
            body.toLocalFrame(local, [this.game.physics.p2.pxmi(pointer.position.x), this.game.physics.p2.pxmi(pointer.position.y)]);
            local = [this.game.physics.p2.mpxi(local[0]), this.game.physics.p2.mpxi(local[1])];
            this.selectionConstraint = this.game.physics.p2.createLockConstraint(this.mouseBody, body, local);
          }
        }
      }, this);
      this.game.input.onUp.add(function() {
        this.game.physics.p2.removeConstraint(this.selectionConstraint);
        this.selectionConstraint = null;
      }, this);
    },
    update: function update() {
      var deadChildren = this.burnables.filter(function(burnable) {
        return burnable.dead;
      });
      for(var i=0; i<deadChildren.length; i++) {
        deadChildren[i].kill();
        this.burnables.splice(this.burnables.indexOf(deadChildren[i]), 1);
      }
    },
    getBurnableBodies: function getBurnableBodies() {
      return this.burnables.map(function(burnable) {
          return burnable.sprite.body;
      });
    },
    collideBurnables: function getBurnableCollisions(point) {
      return this.game.physics.p2.hitTest(point, this.getBurnableBodies());
    },
    addBurnable: function addBurnable() {
      this.burnables.push(this.create.apply(this, arguments));
    }
  });
  
  var Burnable = util.extend(common.PlayContext, 'Burnable', {
    constructor: function Burnable(tilemapKey) {
      this.constructor$PlayContext();
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
      this.sprite = this.game.add.sprite(0, 0, this.texture, undefined, this.parent.group);
      this.game.physics.p2.enable(this.sprite);
      this.sprite.body.data.burnable = this;
      
      this.refresh(true);
      this.sprite.body.reset(200, 200);
      this.onUpdate.add(this.update, this);
    },
    getTile: function getTile(x, y, value) {
      return this.tilemapData[y * this.mapwidth + x];
    },
    setTile: function setTile(x, y, value) {
      if(this.getTile(x, y) != value) {
        this.tilemapData[y * this.mapwidth + x] = value;
        if(value == 0) {
          this.dirty = true;
        } else {
          var tile = this.game.add.sprite(0, 0, 'image/fireOverlay', value - 1);
          this.texture.renderXY(tile, x * this.tilewidth, y * this.tileheight, false);
          tile.parent.remove(tile);
        }
      }
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
      var rects = [];
      for(var y=0; y<this.mapheight; y++) {
        for(var x=0; x<this.mapwidth; x++) {
          var index = this.tilemapData[i++];
          if(index) {
            tile.frame = index - 1;
            this.texture.renderXY(tile, x * this.tilewidth, y * this.tileheight, false);
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
              var otherPos = Phaser.Point.add(pos, this.game.rnd.pick(common.DIRECTIONS));
              var otherTile = this.getTile(otherPos.x, otherPos.y);
              if(otherTile == 2) {
                this.setTile(otherPos.x, otherPos.y, 3);
              }
            }
            
            if(this.game.rnd.frac() < 0.1) { //spread to other burnables
              var point = pos
                .multiply(this.tilewidth, this.tileheight)
                .rotate(0, 0, this.sprite.body.angle)
                .add(this.sprite.position.x, this.sprite.position.y)
                .add(this.game.rnd.integerInRange(-10, 10), this.game.rnd.integerInRange(0, -50));
              
              var bodies = this.fire.collideBurnables(point);
              if(bodies.length > 0 && bodies[0].burnable) {
                var body = bodies[0];
                var burnable = body.burnable;
                var local = [0, 0];
                body.toLocalFrame(local, [this.game.physics.p2.pxmi(point.x), this.game.physics.p2.pxmi(point.y)]);
                local = [this.game.physics.p2.mpxi(local[0]),
                         this.game.physics.p2.mpxi(local[1])];
                local = [Math.floor((local[0] + burnable.texture.width  / 2) / burnable.tilewidth ), 
                         Math.floor((local[1] + burnable.texture.height / 2) / burnable.tileheight)];
                var value = burnable.getTile(local[0], local[1]);
                if(value == 2) {
                  burnable.setTile(local[0], local[1], 3);
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
  
  var Flame = util.extend(Burnable, 'Flame', {
    constructor: function Flame() {
      this.constructor$Burnable('tilemap/flame');
      this.goesOut = false;
    }
  });
  
  return {
    Fire: Fire,
    Burnable: Burnable,
    Flame: Flame
  }
});