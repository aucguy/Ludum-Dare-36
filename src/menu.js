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
        this.callbacks.spawnMenuInOut = function() {
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
      
      for(var i=0; i<2; i++) {
        this.callbacks['wood' + i] = (function() {
          var clazz;
          if(i == 0) {
            clazz = fire.Burnable;
          } else if(i == 1) {
            clazz = fire.Flame;
          }
          return function() {
            var x = this.game.input.position.x;
            var y = this.game.input.position.y;
            var burnable = this.fire.create(clazz, x, y, 'tilemap/test');
            this.fire.addBurnable(burnable);
            this.fire.grab(burnable.sprite.body, this.game.input.position);
          }.bind(this);
        }.bind(this))();
      }
      
      var createTab = (function (self, other) {
        this.callbacks[self + 'Tab'] = (function() {
          var selfGroup = this.getElementById(self + 'Group');
          var otherGroup = this.getElementById(other + 'Group');
          selfGroup.attribute('visibility', true).value = 'visible';
          otherGroup.attribute('visibility', true).value = 'hidden';
          this.dirty = true;
        }).bind(this);
      }).bind(this);
      createTab('food', 'wood');
      createTab('wood', 'food');
      this.callbacks.woodTab();
    },
    update: function update() {
      this.update$Menu();
    }
  });
  
  return {
    PlayMenu: PlayMenu
  }
});