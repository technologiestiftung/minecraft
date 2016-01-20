var fs = require('fs');
var zlib = require('zlib');

// var NBT = require('./NBT.js');
var Region = require('./Region.js');

//*****************************************************************************

function address(x, y, z) {
	var rx = x % 512;
	var rz = z % 512;

	if (x < 0) {
    rx = 511-rx;
  }

	if (z < 0) {
    rz = 511-rz;
  }

	return [rx, y, rz];
}

//*****************************************************************************

var World = module.exports = function(dir) {
	this.dir = dir;
	this.regions = {};

  // this.level = NBT.fromGzipFile(this.dir + '/level.dat');
  // this.changed = false;
  // console.log('Level loaded');
};

World.prototype.setBlock = function(x, y, z, blockType) {
  return this.getBlockRegion(x, z).setBlock(address(x, y, z), blockType);
};

World.prototype.save = function() {
  var file;

 	// if (this.changed) {
  //   this.level.toGzipFile(this.dir + '/level.dat');
  //   this.changed = false;
 	// 	console.log('Level saved');
 	// }

 	for (var z in this.regions) {
 		for (var x in this.regions[z]) {
      if (this.regions[z][x].changed) {
 				file = 'r.' + x + '.' + z + '.mca';
 				this.regions[z][x].toFile(this.dir + '/region/' + file);
 			  this.regions[z][x].changed = false;
 				console.log('Region saved', file);
 		  }
 	  }
  }
};

World.prototype.getBlockRegion = function(bx, bz) {
  var x = bx/512 <<0;
  var z = bz/512 <<0;

	if (this.regions[z] === undefined) {
    this.regions[z] = {};
  }

	if (this.regions[z][x] === undefined) {
		var file = 'r.'+ x +'.'+ z +'.mca';
		if (fs.existsSync(this.dir + '/region/' + file)) {
			this.regions[z][x] = Region.fromFile(this.dir + '/region/' + file);
    	this.regions[z][x].changed = false;
			console.log('Region loaded', x, z);
    }	else {
      this.regions[z][x] = new Region();
      this.regions[z][x].addLayer(0, 7); // add a base layer of bedrock
      this.regions[z][x].changed = true;
      console.log('Region created', x, z);
		}

    if (x < 0) {
      this.regions[z][x].invertZ();
    }

    if (x < 0) {
      this.regions[z][x].invertX();
    }
	}

	return this.regions[z][x];
};


// World.prototype.getBlock = function(x, y, z) {
// 	return this.getBlockRegion(x, z).getBlock(address(x, y, z));
// };

// World.prototype.getBiome = function(x, z) {
// 	return this.getBlockRegion(x, z).getBiome(address(x, 0, z));
// };

// World.prototype.setBiome = function(x, z, id) {
// 	var xyz = address(x, 0, z);
// 	return this.getBlockRegion(x, z).setBiome(xyz[0], xyz[2], id);
// };
