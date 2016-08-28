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
      
      this.callbacks.wood1 = function() {
        this.fire.addBurnable(fire.Burnable, 'tilemap/test');
      }.bind(this);
    },
    update: function update() {
      this.update$Menu();
    }
  });
  
  return {
    PlayMenu: PlayMenu
  }
});