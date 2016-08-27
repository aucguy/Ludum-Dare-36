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
  
  return {
    DIRECTIONS: DIRECTIONS,
    PlayContext: PlayContext
  };
})