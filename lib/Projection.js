
var Transform = require('./Transform.js');

//*****************************************************************************

var Projection = module.exports = function(world, x, y) {
	this.world = world;
	//this.offsetX = x;
	//this.offsetY = y;
};

Projection.prototype.process = function(options) {
	var blockCount = 0;
	for (var z = 0; z <= options.sizeY; z++) {
		console.log('row', options.sizeX, z);

		for (var x = 0; x <= options.sizeX; x++) {
      var blockType = 1; // stone
			var featureMinHeight = 0;
      var featureHeight = 0;

      //if (options.MAPTILES !== undefined) {
      //  var pos = Transform.fromXY(this.offsetX+x, this.offsetY+y);
      //	block = options.MAPTILES.blockAt(pos);
      //}

      for (var i = featureMinHeight; i <= featureHeight && i <= 256; i++) {
        this.world.setBlock(x, i, z, blockType);
      }

			blockCount++;
			if (blockCount % (256*256) === 0) {
        this.world.save();
      }
		}
	}			

	this.world.save();
};
