var fs = require('fs');
var zlib = require('zlib');
var nbt = require('prismarine-nbt');
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
	this.level = {};
	this.readLevel();
};

World.prototype.readLevel = function() {
  fs.readFile(this.dir + '/level.dat', function(error, data) {
    nbt.parse(data, function(err, data) {
      this.level = data;
  // this.level._changed = 0;
    }.bind(this));
  });
};


//*****************************************************************************
//*****************************************************************************
//*****************************************************************************


World.prototype.getBlock = function(x, y, z) {
	return this.blockRegion(x, y, z).getBlock(address(x, y, z));
};

World.prototype.setBlock = function(x, y, z, id) {
	return this.blockRegion(x, y, z).setBlock(address(x, y, z), id);
};

World.prototype.blockRegion = function(x, y, z) {
	return this.region(x/512 <<0, z/512 <<0);
};

World.prototype.getBiome = function(x, z) {
	return this.blockRegion(x, 0, z).getBiome(address(x, 0, z));
};

World.prototype.setBiome = function(x, z, id) {
	var xyz = address(x, 0, z);
	return this.blockRegion(x, 0, z).setBiome(xyz[0], xyz[2], id);
};

World.prototype.save = function() {
	var acted;

	if (this.level._changed) {
		console.log('SAVING LEVEL.DAT');
		this.saveLevel;
		acted = true;
	}

	for (var regZ in this.regions) {
		for (var regX in this.regions[regZ])	{
      if (this.regions[regZ][regX]._changed) {
				var filename = 'r.' + regX + '.' + regZ + '.mca';
				console.log('SAVING REGION ' + filename + '...');
				this.regions[regZ][regX].toFile(this.dir + '/region/filename');
				this.regions[regZ][regX]._changed = 0;
				acted = true;
				console.log('done');
			}
		}
	}

	if (!acted) {
		console.log('Did not save anything!');
	}
};

World.prototype.saveLevel = function() {
	var levelFile = this.dir + '/level.dat';
	var buffer = this.level.toString();
//	gzip \buffer => level_file;
	this.level._changed = 0;
};


World.prototype.region = function(regX, regZ) {
	if (this.regions[regZ][regX] === undefined) {
		var file = this.dir + '/region/r.regX.regZ.mca';
		if (fs.existsSync(file)) {
			console.log('LOADING REGION regX, regZ .. ');
			this.regions[regZ][regX] = Minecraft.Region.fromFile(file);
			this.regions[regZ][regX]._changed = 0;
			console.log('done');
		}	else {
			this.initRegion(regX, regZ);
		}
		this.regions[regZ][regX].invert_z = regZ < 0;
		this.regions[regZ][regX].invert_x = regX < 0;
	}
	return this.regions[regZ][regX];
};

World.prototype.initRegion = function(regX, regZ) {
	console.log('INIT REGION regX,regZ .. ');
	this.regions[regZ][regX] = new Minecraft.Region();
	this.regions[regZ][regX]._changed = 1;
	this.regions[regZ][regX].addLayer(0, 7); // add bedrock
	console.log('done');
};
