base.registerModule('common', function() {
  var util = base.importModule('util');
  
  var DIRECTIONS = [
    new Phaser.Point(-1,  0),
    new Phaser.Point( 1,  0),
    new Phaser.Point( 0, -1),
    new Phaser.Point( 0,  1)
  ];
  
  var PlayContext = util.extend(util.Contextual, 'PlayContext', {
    game: util.contextAttr,
    top: util.contextAttr,
    fire: util.contextAttr,
    onUpdate: util.contextAttr
  });
  
  function localizePoint(body, point, game) {
    //from http://phaser.io/examples/v2/p2-physics/pick-up-object
    var local = [0, 0];
    body.toLocalFrame(local, [game.physics.p2.pxmi(point.x),
                              game.physics.p2.pxmi(point.y)]);
    local = [game.physics.p2.mpxi(local[0]),
             game.physics.p2.mpxi(local[1])];
    return local
  }
  
  return {
    DIRECTIONS: DIRECTIONS,
    PlayContext: PlayContext,
    localizePoint: localizePoint
  };
})