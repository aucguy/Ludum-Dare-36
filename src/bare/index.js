var base = base || {};
(function() {
  var logo;
  var logoLoaded = false;

  base.indexFunc = function indexFunc(state) {
    var assets = [
      ['image/fireOverlay',   'assets/image/fireOverlay.png', 'image'],
      ['image/terrain',       'assets/image/terrain.png',     'image'],
      ['image/burn',          'assets/image/burn.png',        'spritesheet', {
        frameWidth: 16,
        frameHeight: 16,
        pixelated: true
      }],
      ['image/log',           'assets/image/log.png',         'image'],
      ['image/match',         'assets/image/match.png',       'image'],
      ['image/hotdog',        'assets/image/hotdog.png',      'image'],
      ['image/terrain',       'assets/image/terrain.png',     'image'],
      
      ['tilemap/log',         'assets/tilemap/log.json',      'json'],
      ['tilemap/match',       'assets/tilemap/match.json',    'json'],
      ['tilemap/hotdog',      'assets/tilemap/hotdog.json',   'json'],
      ['tilemap/terrain',     'assets/tilemap/terrain.json',  'json'],
      
      ['gui/play',            'assets/gui/play.svg',          'text'],
      ['data/fire',           'assets/data/fire.json',        'text']
    ];
    //#mode dev
    base.loadAssets(assets.concat([
      ['scripts/phaser',      'lib/phaser/build/phaser.js',   'script'],
      ['scripts/canvg',       'lib/canvg/canvg.js',           'script'],
      ['scripts/rgbcolor',    'lib/canvg/rgbcolor.js',        'script'],
      ['scripts/stackblur',   'lib/canvg/StackBlur.js',       'script'],
      ['scripts/stateMachine', 'lib/javascript-state-machine/state-machine.js', 'script'],
      ['scripts/phaserInjector', 'lib/basejs/src/injectors/phaserInjector.js', 'script'],

      ['scripts/main',        'src/bare/main.js',             'script'],
      ['scripts/gui',         'src/bare/gui.js',              'script'],
      ['scripts/util',        'src/bare/util.js',             'script'],
      ['scripts/app',         'src/app.js',                   'script'],
      ['scripts/fire',        'src/fire.js',                  'script'],
      ['scripts/menu',        'src/menu.js',                  'script'],
      ['scripts/common',      'src/common.js',                'script']
    ]));
    //#mode none
    //#mode rel
    //base.loadAssets(assets.concat([
    // ['scripts/app',        'app.min.js',                   'script']
    //]));
    //#mode none

    logo = new Image();
    logo.onload = base.external(function() {
      logoLoaded = true;
    });
    logo.src = 'assets/image/logo.svg';
  };
  base.renderLoadingScreen = function(canvasID, loading, loaded) {
    var display = document.getElementById(canvasID);
    if(display === null) return;
    var context = display.getContext('2d');
    if(context === null) return;
    var width = context.canvas.width;
    var height = context.canvas.height;

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    if(logoLoaded) {
      context.drawImage(logo, (width - logo.width) / 2, (height - logo.height) / 2);
    }
    context.fillStyle = '#000000';
    context.beginPath();
    context.rect(20, height - 40, width - 40, 20);
    context.stroke();
    context.beginPath();
    context.rect(20, height - 40, (loaded / (loaded + loading)) * (width - 40), 20);
    context.fill();
  };
})();
