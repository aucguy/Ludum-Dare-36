base.registerModule('menu', function() {
  var fire = base.importModule('fire');
  var common = base.importModule('common');
  var util = base.importModule('util');
  var gui = base.importModule('gui');
  
  var PlayMenu = util.extend([gui.Menu, common.PlayContext], 'PlayMenu', {
    constructor: function PlayMenu() {
      this.constructor$PlayContext();
      this.constructor$Menu('gui/play', this.game, this.onUpdate);
      
      (function() {
        var out = true;
        var transformBase = null;
        var first = true;
        this.clickCallbacks.spawnMenuInOut = function() {
          var spawnMenu = this.getElementById('spawnMenu');
          var spawnMenuInOut = this.getElementById('spawnMenuInOut');
          var transform = spawnMenu.attribute('transform', true);
          if(first) {
            first = false;
            transformBase = transform.value;
          }
          out = !out;
          var move = -spawnMenu.getBoundingBox().width() + 
                      spawnMenuInOut.getBoundingBox().width();
          transform.value = transformBase + ' translate(' + (out ? '0' : move) + ',0)';
          this.dirty = true;
        }.bind(this);
      }.bind(this))();
      
      for(var i=0; i<3; i++) {
        this.clickCallbacks[['wood0', 'wood1', 'food0'][i]] = (function() {
          var clazz, tilemapKey, imageKey;
          if(i == 0) {
            clazz = fire.Burnable;
            tilemapKey = 'tilemap/test';
            imageKey = 'image/log';
          } else if(i == 1) {
            clazz = fire.Flame;
            tilemapKey = undefined;
            imageKey = undefined;
          } else if(i == 2) {
            clazz = fire.Food;
            tilemapKey = 'tilemap/hotdog';
          }
          return function() {
            var x = this.game.input.position.x;
            var y = this.game.input.position.y;
            var burnable = this.fire.create(clazz, x, y, tilemapKey, imageKey);
            var cost = burnable.cost();
            this.fire.addBurnable(burnable);
            if(this.top.money >= cost) {
              this.top.money -= cost;
              this.fire.grab(burnable.sprite.body, this.game.input.position);
            } else {
              burnable.dead = true;
            }
          }.bind(this);
        }.bind(this))();
      }
      
      var createTab = (function (self, other) {
        this.clickCallbacks[self + 'Tab'] = (function() {
          var selfGroup = this.getElementById(self + 'Group');
          var otherGroup = this.getElementById(other + 'Group');
          selfGroup.attribute('visibility', true).value = 'visible';
          otherGroup.attribute('visibility', true).value = 'hidden';
          this.dirty = true;
        }).bind(this);
      }).bind(this);
      createTab('food', 'wood');
      createTab('wood', 'food');
      this.clickCallbacks.woodTab();
      
      this.releaseCallbacks.output = function(event) {
        if(event.burnable) {
          this.top.money += event.burnable.value();
          event.burnable.dead = true;
        }
      }.bind(this);
    },
    update: function update() {
      var money = this.getElementById('money');
      if(money.children[0].children[0].text != '' + this.top.money) {
        money.children[0].children[0].text = '' + this.top.money;
        this.dirty = true;
      }
      this.update$Menu();
    }
  });
  
  return {
    PlayMenu: PlayMenu
  }
});