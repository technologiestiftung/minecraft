
var Region = require('./Region.js');

//*****************************************************************************

function address(x) {
  var rx = x % 512;
  if (x < 0) {
    rx = 511 - rx;
  }
  return rx;
}

//*****************************************************************************

var World = module.exports = function(dir) {
	this.dir = dir;
  this.regions = {};
};

World.prototype.getBlock = function(x, y, z) {
	var region = this.getRegion(x, y, z);
  return region.getBlock(address(x), y, address(z));
};

World.prototype.setBlock = function(x, y, z, blockType) {
	var region = this.getRegion(x, y, z);
  return region.setBlock(address(x), y, address(z), blockType);
};

World.prototype.save = function() {
	for (var rz in this.regions) {
    for (var rx in this.regions[rz]) {
			if (this.regions[rz][rx].changed) {
				var filename = 'r.' + rx + '.' + rz + '.mca';
				console.log('saving region ' + filename);
				this.regions[rz][rx].save(this.dir + '/region/' + filename);
				this.regions[rz][rx].changed = 0;
			}
		}
	}
};

World.prototype.getRegion = function(x, z) {
  var rx = x/512 <<0;
  var rz = z/512 <<0;

  if (this.regions[rz] === undefined) {
    this.regions[rz] = {};
  }

	if (this.regions[rz][rx] === undefined) {
    this.createRegion(rx, rz);
	}

	return this.regions[rz][rx];
};

World.prototype.createRegion = function(rx, rz) {
	console.log('create region', rx, rz);
	this.regions[rz][rx] = new Region(rx, rz);

  for (var offZ = 0; offZ < 16; offZ++) {
    for (var offX = 0; offX < 16; offX++) {
      this.regions[rz][rx].setBlock(rx*16 + offX, 0, rz*16 + offZ, 7); // blockType 7 : bedrock
    }
  }

	this.regions[rz][rx].changed = 1;
};
