
var fs = require('fs');
var zlib = require('zlib');

var Region = require('./Region.js');

//*****************************************************************************

function address(n) {
	var r = n % 512;
	if (n < 0) {
    r = 511-r;
  }
	return r;
}

//*****************************************************************************

var World = module.exports = function(dir) {
	this.dir = dir;
	this.regions = {};
};

World.prototype.setBlock = function(x, y, z, blockType) {
  var region = this.getRegion(x, z);
  region.setBlock(address(x), y, address(z), blockType);
};

World.prototype.save = function() {
  var file;
 	for (var z in this.regions) {
 		for (var x in this.regions[z]) {
      if (this.regions[z][x].changed) {
 				file = 'r.' + x + '.' + z + '.mca';
 				this.regions[z][x].save(this.dir + '/region/' + file);
 				console.log('Region saved', x, z);
 		  }
 	  }
  }
};

World.prototype.getRegion = function(bx, bz) {
  var x = bx/512 <<0;
  var z = bz/512 <<0;

	if (this.regions[z] === undefined) {
    this.regions[z] = {};
  }

	if (this.regions[z][x] === undefined) {
    this.regions[z][x] = new Region();
    this.regions[z][x].addLayer(0, 7); // adds a base layer of bedrock

    // TODO
    if (x < 0) {
      this.regions[z][x].invertZ();
    }

    // TODO
    if (x < 0) {
      this.regions[z][x].invertX();
    }
	}

	return this.regions[z][x];
};
