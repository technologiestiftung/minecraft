
var fs = require('fs');
var zlib = require('zlib');

var NBT = require('./NBT.js');

//*****************************************************************************

var CHR0 = String.fromCharCode(0)

function chrSet(str, index, char) {
  return str.slice(0, index) + char + str.slice(index + 1);
}

function strRepeat(str, num) {
  var res = '';
  for (var i = 0; i < num; i++) {
    res += str;
  }
  return res;
}

//*****************************************************************************

var Region = module.exports = function() {
	this.data = '';
	this.offset = 0;
	this.length = 0;
  this.chunks = {};
};

//*****************************************************************************

Region.fromFile = function(file) {
	return Region.fromString(fs.readFileSync(file));
};

Region.fromString = function(data) {
  var region = new Region();

	region.data = data;
	region.offset = 0;
	region.length = data.length;

	for (var z = 0; z < 32; z++) {
		for (var x = 0; x < 32; x++) {
 			region.offset = 4 * (x + z * 32);
			var b1 = region.getByte();
			var b2 = region.getByte();
			var b3 = region.getByte();
			var b4 = region.getByte();
			var chunkOffset = (b1<<16) + (b2<<8) + (b3);

			if (chunkOffset === 0) {
        continue;
      }

 			region.offset = 4*32*32  + 4 * (x + z * 32);
			var chunkTime = region.getInt32();

			// <<12 = 4096
			region.offset = chunkOffset<<12;
			var chunkLength = region.getInt32();
			var compressionType = region.getByte();
			var czComp = region.data.substr((chunkOffset<<12) + 5, chunkLength-1);

			var chunk;
			if (compressionType === 1) {
        chunk = zlib.gunzipSync(czComp);
			} else if (compressionType === 2) {
        throw ('+++ COMPERSSION TYPE 2 +++');
				// chunk = zlib.uncompress(czComp);
			} else {
				throw ('Unknown compression type ' + compressionType);
			}

			region[z][x].chunk = new NBT(chunk);
			region[z][x].timestamp = chunkTime;
		}
	}

	return region;
};

//*****************************************************************************

Region.prototype.getChars = function(n) {
	if (this.offset >= this.length) {
		console.log('Warning: Stream is out of data');
	}
	var v = this.data.substr(this.offset, n);
	this.offset += n;
	return v;
};

Region.prototype.getByte = function() {
  return this.getChars(1).charAt();
};

Region.prototype.getInt32 = function() {
	var t1 = this.getByte();
	var t2 = this.getByte();
	var t3 = this.getByte();
	var t4 = this.getByte();
	return (t1<<24) + (t2<<16) + (t3<<8) + t4;
};

Region.prototype.addLayer = function(y, type) {
 	for (var z = 0; z < 512; z++) {
 		for (var x = 0; x < 512; x++) {
 			this.setBlock(x, y, z, type);
 		}
 	}
};

Region.prototype.setBlock = function(x, y, z, type) {
	var subtype = 0;

  if (parseInt(type, 10) !== type) {
    var t = type.split('.');
		type = parseInt(t[0], 10);
    subtype = t[1] === '1' ? 10 : parseInt(t[1], 10);
	}

	if (type !== (type & 255)) {
    throw('bad type passed to setBlock: ' + type);
  }

	if (subtype !== (subtype & 15) ) {
    throw('bad subtype passed to set_block: ' + subtype);
  }

  var section = this.getBlockSection(x, y, z);
	if (!section) {
		section = this.addSection(x, y, z);
	}

	var offset = this.getBlockOffset(x, y, z);

  section.Blocks.value = chrSet(section.Blocks.value, offset, String.fromCharCode(type));

	// set subtype
	var byte = section.Data.value.charCodeAt(offset/2);
	if (offset % 2 === 0 ) {
		byte = (byte & 240) + subtype;
	} else {
		byte = subtype * 16 + (byte & 15);
	}

  section.Data.value = chrSet(section.Data.value, offset/2, String.fromCharCode(byte));

	this.changed = true;
};

Region.prototype.getBlockSection = function(x, y, z) {
  var c = this.getChunkXZ(x, z);
  if (this.chunks[c.z]) {
	  var chunk = this.chunks[c.z][c.x];
  }

	if (chunk === undefined) {
    return;
  }

	var sectionY = y/16 <<0;
	var sections = chunk.tag.value.Level.value.Sections;
	return sections[sectionY];
};

Region.prototype.getChunkXZ = function(x, z) {
	return { x:x/16 <<0, z:z/16 <<0 };
};

Region.prototype.addSection = function(x, y, z) {
  var c = this.getChunkXZ(x, z);

	if (this.chunks[c.z] === undefined || this.chunks[c.z][c.x] === undefined) {
		this.addChunk(c.x, c.z);
	}

	var chunk = this.chunks[c.z][c.x];
  console.log(chunk)
	var sections = chunk.value.Level.value.Sections;

	var sectionY = y/16 <<0;

	for (var i = 0; i <= sectionY; i++) {
		if (sections.value[i] !== undefined) {
      continue;
    }

    var value = {
		  Y:          NBT.createTag(NBT.BYTE,       'Y',          i),
		  Blocks:     NBT.createTag(NBT.BYTE_ARRAY, 'Blocks',     strRepeat(CHR0, 4096)),
		  BlockLight: NBT.createTag(NBT.BYTE_ARRAY, 'BlockLight', strRepeat(CHR0, 2048)),
		  SkyLight:   NBT.createTag(NBT.BYTE_ARRAY, 'SkyLight',   strRepeat(String.fromCharCode(255), 2048)),
		  Data:       NBT.createTag(NBT.BYTE_ARRAY, 'Data',       strRepeat(CHR0, 2048))
    }

		sections.value[i] = NBT.createTag(NBT.COMPOUND, null, value);
	}

	this.changed = true;

	return sections.value[i];
};

Region.prototype.addChunk = function(x, z) {
  var value = {
    TerrainPopulated: NBT.createTag(NBT.BYTE,       'TerrainPopulated', 1),
    Biomes:           NBT.createTag(NBT.BYTE_ARRAY, 'Biomes',           strRepeat(CHR0, 256)),
    xPos:             NBT.createTag(NBT.INT,        'xPos',             x),
    zPos:             NBT.createTag(NBT.INT,        'zPos',             z),
    LightPopulated:   NBT.createTag(NBT.BYTE,       'LightPopulated',   0),
    Entities:         NBT.createTag(NBT.LIST,       'Entities',         [], 10),
    TileEntities:     NBT.createTag(NBT.LIST,       'TileEntities',     [], 10),
    LastUpdate:       NBT.createTag(NBT.LONG,       'LastUpdate',       0),
    HeightMap:        NBT.createTag(NBT.INT_ARRAY,  'HeightMap',        []),
    Sections:         NBT.createTag(NBT.LIST,       'Sections',         [], 10)
  };

	var level = NBT.createTag(NBT.COMPOUND, 'Level', value);

  if (this.chunks[z] === undefined) {
    this.chunks[z] = {};
  }

  this.chunks[z][x] = {
		timestamp: Date.now(),
		chunk: NBT.createTag(NBT.COMPOUND, '', { Level:level })
	};

	this.changed = true;
};

Region.prototype.getBlockOffset = function(x, y, z) {
 	var localX = x & 15;
  var localY = y & 15;
 	var localZ = z & 15;
 	return 16*16*localY + 16*localZ + localX;
};

Region.prototype.toString = function() {
	var chunkOffset = 2;
	var offset = [];
	var timeData = [];
	var chunkData = [];

	// turn each chunk into data
	for (var z = 0; z < 32; z++)	{
		for (var x = 0; x < 32; x++) {
 			if (this.chunks[z][x] === undefined) {
 				offset.push(CHR0+CHR0+CHR0+CHR0);
 				timeData.push(CHR0+CHR0+CHR0+CHR0);
 				continue;
 			}

 			var chunkTime = this.chunks[z][x].timestamp;
 			var chunkNBT = this.chunks[z][x].chunk.toString();
   		var czCcomp = zlib.compressSync(chunkNBT);
 			var length = czCcomp.length + 1;

 			var chunk = String.fromCharCode((length >>24) & 255) + String.fromCharCode((length >>16) & 255) + String.fromCharCode((length >>8) & 255) + String.fromCharCode((length) & 255);
 			chunk += String.fromCharCode(2);
 			chunk += czCcomp;

 			if (chunk.length % 4096 !== 0) {
 				chunk += strRepeat(CHR0, 4096 - (chunk.length % 4096));
 			}

 			if (chunk.length % 4096 !== 0) {
 				throw('Math fail');
 			}

 			var sectors = chunk.length/4096;

 			chunkData.push(chunk);
 			offset.push(String.fromCharCode((chunkOffset >>16) & 255) + String.fromCharCode((chunkOffset >>8) & 255) + String.fromCharCode((chunkOffset) & 255) + String.fromCharCode(sectors));
 			timeData.push(String.fromCharCode((chunkTime >>24) & 255) + String.fromCharCode((chunkTime >>16) & 255) + String.fromCharCode((chunkTime >>8) & 255) + String.fromCharCode((chunkTime) & 255));
 			chunkOffset += sectors;
 		}
 	}

 	return [offset, timeData, chunkData].join('');
};

Region.prototype.toFile = function(file) {
  fs.writeFileSync(this.toString())
};

//*****************************************************************************

// // Getters & Setters
// // Coordinates relative to *Region*

// Region.prototype.getBiomeOffset = function(relX, relZ) {
// 	var localX = relX & 15;
// 	var localZ = relZ & 15;
// 	return 16*localZ + localX;
// };

// Region.prototype.getBlock = function(relX, y, relZ) {
// 	var section = this.getBlockSection(relX, y, relZ);
// 	if (!section) {
//     return 0;
//   }
// 	var offset = this.getBlockOffset(relX, y, relZ);
// 	return ord( substr( section.Blocks, offset, 1) );
// };

// Region.prototype.getBiome = function(relX, relZ) {
// //	var (chunkX, chunkZ) = this.getChunkXZ(relX,relZ);
//
//   if (this.chunks[chunkZ][chunkX].chunk === undefined) {
//     return;
//   }
//
// 	var chunk = this.chunks[chunkZ][chunkX].chunk;
// 	var level = chunk.Level;
// 	var offset = this.getBiomeOffset(relX, relZ);
//
// 	return ord(substr(level.Biomes, offset, 1));
// };

// Region.prototype.setBiome = function(relX, relZ, type) {
// 	if (type != (type&255)) {
//     throw('bad type passed to setBiome: type');
//   }
//
// 	// var chunk_x, chunk_z = this.getChunkXZ(relX,relZ);
// 	// var chunk_x, chunk_z = this.getChunkXZ(relX,relZ);
//
// 	if (this.chunks[chunkZ][chunkX].chunk === undefined) {
// 		this.addChunk(chunkX, chunkZ);
// 	}
// 	var chunk = this.chunks[chunkZ][chunkX].chunk;
// 	var level = chunk.Level;
// 	var offset = this.getBiomeOffset(relX, relZ);
//
// 	substr(level.Biomes, offset, 1) = String.fromCharCode(type);
//
// 	this.changed = true;
// };
