import * as util from '/lib/util.js';
import * as common from './common.js';

var Fire = util.extend(common.PlayContext, 'Fire', {
  constructor: function Fire() {
    this.constructor$PlayContext();
    this.burnables = [];
    this.selectionConstraint = null;
    this.selectionBurnable = null;

    this.flameTexture1 = this.game.add.renderTexture(this.game.width, this.game.height);
    this.flameTexture2 = this.game.add.renderTexture(this.game.width, this.game.height);
    this.flameSprite = this.game.add.sprite(0, 0, this.flameTexture1);
    this.flameSprite.alpha = 0.5;

    this.terrain = this.create(Terrain, this.game.width / 2, this.game.height / 2, 'tilemap/terrain', 'image/terrain');
    this.group = this.game.add.group(undefined, 'fire');
    this.mouseBody = this.game.physics.p2.createBody(0, 0, 0, true);

    this.game.input.addMoveCallback(function(pointer) {
      this.mouseBody.reset(pointer.position.x, pointer.position.y);
    }, this);

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
      this.top.playMenu.canvg.Mouse.events.push({
        type: 'onrelease',
        x: pointer.position.x,
        y: pointer.position.y,
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
    for(var i = 0; i < deadChildren.length; i++) {
      var child = deadChildren[i];
      if(child == this.selectionBurnable) {
        this.ungrab();
      }
      child.kill();
      this.burnables.splice(this.burnables.indexOf(child), 1);
    }

    /*var radius = 5;
    var matrix = new Phaser.Matrix(1, 0, 0, 0.9, 0, -10);
    var currentTexture = this.flameSprite.texture;
    var otherTexture = currentTexture == this.flameTexture1 ? this.flameTexture2 : this.flameTexture1;
    for(var i=0; i<this.burnables.length; i++) {
      var burnable = this.burnables[i];
      if(burnable.catchesFire) {
        var width = burnable.flameTexture.width;
        var height = burnable.flameTexture.height;
        var originalCanvas = burnable.flameTexture.getCanvas();
        var blurredContext = util.createCanvas(width + 2 * radius, height + 2 * radius).getContext('2d');
        blurredContext.drawImage(originalCanvas, radius, radius);
        stackBlur.canvasRGBA(blurredContext, 0, 0, width, height, radius);
        var blurredTexture = PIXI.Texture.fromCanvas(blurredContext.canvas);
        var textureHolder = this.game.add.sprite(0, 0, blurredTexture);
        otherTexture.renderXY(textureHolder, burnable.sprite.position.x - width  / 2,
                                             burnable.sprite.position.y - height / 2);
        textureHolder.destroy();
      }
    }
    otherTexture.render(this.flameSprite, matrix);
    currentTexture.clear();
    this.flameSprite.setTexture(otherTexture);*/
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
    this.makeInvisible = this.makeInvisible === undefined ? true : this.makeInvisible;

    var tilemap = this.top.cache.getJSON(tilemapKey);
    this.tilewidth = tilemap.tilewidth;
    this.tileheight = tilemap.tileheight;
    this.mapwidth = tilemap.width;
    this.mapheight = tilemap.height;
    this.tilemapData = new Uint8Array(tilemap.layers[0].data);
    this.templateImage = this.top.cache.getImage(imageKey);

    this.texture = util.createBitmap(this.game, tilemap.width * tilemap.tilewidth, tilemap.height * tilemap.tileheight);
    this.flameTexture = this.game.add.renderTexture(tilemap.width * tilemap.tilewidth, tilemap.height * tilemap.tileheight);
    this.sprite = this.game.add.sprite(0, 0, this.texture, undefined, parent);
    this.game.physics.p2.enable(this.sprite);

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

    this.dead = true;
    this.sprite.body.clearShapes();
    var tile = this.game.make.sprite(0, 0, 'image/fireOverlay');
    var burnImage = this.top.cache.getImage('image/burn');
    var overlayImage = this.top.cache.getImage('image/fireOverlay');
    this.texture.ctx.drawImage(this.templateImage, 0, 0);
    this.texture.dirty = true;
    this.flameTexture.clear();

    var i = 0;
    var rects = [];
    var rect;
    for(var y = 0; y < this.mapheight; y++) {
      for(var x = 0; x < this.mapwidth; x++) {
        var index = this.tilemapData[i++];
        if(index) {
          this.dead = false;

          if(index >= 3) {
            tile.alpha = 1;
            var dstX = x * this.tilewidth;
            var dstY = y * this.tileheight;
            this.texture.ctx.globalAlpha = 0.05;
            if(this.catchesFire) {
              this.texture.ctx.drawImage(overlayImage, 0, 0, this.tilewidth, this.tileheight, dstX, dstY, this.tilewidth, this.tileheight);
              this.flameTexture.renderXY(tile, dstX, dstY, false);
            } else {
              var srcX = (index % 4) * this.tilewidth;
              var srcY = Math.floor(index / 4) * this.tileheight;
              this.texture.ctx.drawImage(burnImage, srcX, srcY, this.tilewidth, this.tileheight,
                dstX, dstY, this.tilewidth, this.tileheight);
            }
          }

          rect = {
            x: x,
            y: y,
            width: 1,
            height: 1
          };
          //the following is what I think the antichamber block algorithm might be doing
          //refer to the room where one can the digitalized boxes
          var joined = true;
          var everJoined = false;
          while(joined) {
            joined = false;
            for(var k = 0; k < rects.length; k++) {
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
          if(this.makeInvisible) {
            this.texture.ctx.clearRect(x * this.tilewidth, y * this.tileheight, this.tilewidth, this.tileheight);
          }
        }
      }
    }
    tile.kill();
    for(i = 0; i < rects.length; i++) {
      rect = rects[i];
      var width = rect.width * this.tilewidth;
      var height = rect.height * this.tileheight;
      var centerX = rect.x + rect.width / 2;
      var centerY = rect.y + rect.height / 2;
      this.sprite.body.addRectangle(width, height,
        (centerX - this.mapwidth / 2) * this.tilewidth,
        (centerY - this.mapheight / 2) * this.tileheight);
    }
    this.dirty = false;
  },
});

var Burnable = util.extend(Physical, 'Burnable', {
  constructor: function Burnable(x, y, data) {
    this.constructor$Physical(x, y, 'tilemap/' + data.name, 'image/' + data.name);
    this.goesOut = true;
    this.catchesFire = true;
    this.cooks = false;
    this.burnChance = data.burn;
    this.spreadChance = data.spread;
    this.catchChance = data['catch'];
    this.cost_ = data.cost;
    this.sprite.body.data.burnable = this;
    this.onUpdate.add(this.update, this);
  },
  update: function update() {
    if(this.catchesFire) {
      for(var i = 0; i < 3; i++) {
        var pos = new Phaser.Point(this.game.rnd.integerInRange(0, this.mapwidth - 1),
          this.game.rnd.integerInRange(0, this.mapheight - 1));
        var tile = this.getTile(pos.x, pos.y);
        if(tile >= 3) {
          if(this.game.rnd.frac() < this.burnChance) { //burn more if already burning
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

          if(this.game.rnd.frac() < this.spreadChance) { //spread not non-burning tile
            var otherPos = Phaser.Point.add(pos, this.game.rnd.pick(common.DIRECTIONS));
            var otherTile = this.getTile(otherPos.x, otherPos.y);
            if(otherTile == 2) {
              this.setTile(otherPos.x, otherPos.y, 3);
            }
          }
          var point;
          if(this.game.rnd.frac() < this.catchChance) { //spread to other burnables
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
              local = [Math.floor((local[0] + burnable.texture.width / 2) / burnable.tilewidth),
                Math.floor((local[1] + burnable.texture.height / 2) / burnable.tileheight)
              ];
              var value = burnable.getTile(local[0], local[1]);
              if(value == 2 || burnable.cooks) {
                burnable.setTile(local[0], local[1], value + 1);
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
    this.sprite.destroy();
  },
  value: function value() {
    return 0;
  },
  cost: function cost() {
    return this.cost_;
  }
});

var MIN_COOK = 5;
var MAX_COOK = 10;

var Food = util.extend(Burnable, 'Food', {
  constructor: function(x, y, tilemapKey, imageKey) {
    this.constructor$Burnable(x, y, tilemapKey, imageKey);
    this.goesOut = false;
    this.catchesFire = false;
    this.cooks = true;
  },
  value: function value() {
    var value = 0;
    for(var y = 0; y < this.mapheight; y++) {
      for(var x = 0; x < this.mapwidth; x++) {
        var tile = this.getTile(x, y);
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
  constructor: function Terrain(x, y, tilemapKey, imageKey) {
    this.makeInvisible = false;
    this.constructor$Physical(x, y, tilemapKey, imageKey, this.game.world);
    this.sprite.body.kinematic = true;
  },
});

export {
  Fire,
  Burnable,
  Food,
  Flame
};