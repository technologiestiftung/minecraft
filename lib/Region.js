/* global _name */
/* global _name */

// coordinates are relative to the region

var Region = module.exports = function() {};

Region.prototype.chunkXZ = function(relX, relZ) {
	var cx = relX/16 <<0;
	var cz = relZ/16 <<0;
	return [cx, cz];
};

Region.prototype.getBlockSection = function(relX, y, relZ) {
  var c = this.chunkXZ(relX, relZ);
	var chunk = this.chunks[c.z][c.x];

	if (chunk === undefined) {
    return;
  }

	var sectionY = y/16 <<0;
	var sections = chunk.Level.Sections;
	return sections[sectionY];
};

Region.prototype.addSection = function(relX, y, relZ) {
	// work out which chunk
  var c = this.chunkXZ(relX, relZ);

	if (this.chunks[c.z][c.x] === undefined) {
		this.addChunk(c.x, c.z);
	}

	var chunk = this.chunks[c.z][c.x];
	var sections = chunk.Level.Sections;

	var sectionY = y/16 <<0;

	for ( var i = 0; i <= sectionY; i++) {
		if (sections[i] !== undefined) {
      continue;
    }

		var section = {}; // 'NBT.Compound'
		section.Y          = { name:'Y',          value:i }, // 'NBT.Byte'
		section.Blocks     = { name:'Blocks',     value:chr(0)x4096 }, // 'NBT.ByteArray'
		section.BlockLight = { name:'BlockLight', value:chr(0)x2048 }, // 'NBT.ByteArray'
		section.SkyLight   = { name:'SkyLight',   value:chr(255)x2048 }, // 'NBT.ByteArray'
		section.Data       = { name:'Data',       value:chr(0)x2048 }, // 'NBT.ByteArray'
		sections[i] = section;
	}

	this.changed = true;

	return sections[sectionY];
};

Region.prototype.addChunk = function(cX, cZ) {
	var level = { name:'Level' }; // 'NBT.Compound'
	this.chunks[cZ][cX] = {
		timestamp: Date.now(),
		chunk: { name:'', Level:level } // 'NBT.Compound'
	};

	level.TerrainPopulated = { name:'TerrainPopulated', value:1 }; // 'NBT.Byte'
	level.Biomes  = { name:'Biomes', value:chr(0)x256 }; // 'NBT.ByteArray'
	level.xPos = { name:'xPos', value:cX }; // 'NBT.Int'
	level.zPos = { name:'zPos', value:cZ }; // 'NBT.Int'
	level.LightPopulated = { name:'LightPopulated', value:0 }; // 'NBT.Byte'
	level.Entities = { name:'Entities', value:[], type:10 }; // 'NBT.TagList'
	level.TileEntities = { level:'TileEntities', value:[], type:10 }; // 'NBT.TagList'
	level.LastUpdate = { name:'LastUpdate', value:0 }; // 'NBT.Long'
	level.HeightMap = { name:'HeightMap', value:[] }; // 'NBT.IntArray'
	level.Sections = { name:'Sections', value:[], type:10 }; // 'NBT.TagList'

	this.changed = true;
};

Region.prototype.addLayer = function(y, type) {
	for (var relZ = 0; relZ < 512; relZ++) {
		for (var relX = 0; relX < 512; relX++) {
			this.setBlock(relX, y, relZ, type);
		}
	}
};

// Getters & Setters
// Coordinates relative to *Region*

Region.prototype.getBiomeOffset = function(relX, relZ) {
	var localX = relX & 15;
	var localZ = relZ & 15;
	return 16*localZ + localX;
};

Region.prototype.getBlockOffset = function(relX, y, relZ) {
	var localX = relX & 15;
	var localY = y    & 15;
	var localZ = relZ & 15;
	return 16*16*localY + 16*localZ + localX;
};

Region.prototype.getBlock = function(relX, y, relZ) {
	var section = this.getBlockSection(relX, y, relZ);
	if (!section) {
    return 0;
  }
	var offset = this.getBlockOffset(relX, y, relZ);
	return ord( substr( section.Blocks, offset, 1) );
};

Region.prototype.setBlock = function(relX, y, relZ, type) {
	var funcType = '0';
	if (parseInt(type, 10) != type)	{
//		var type, funcType = split( /\./, type );
//		var type, funcType = split( /\./, type );
		if (funcType == '1') {
      funcType = '10';
    }
	}
	if (type != (type & 255)) {
    throw ('bad type passed to setBlock: ' + type);
  }

	if (funcType !== (funcType & 15)) {
    throw ('bad funcType passed to setBlock: ' + funcType);
  }

	var section = this.getBlockSection(relX, y, relZ);
	if (!section)	{
		section = this.addSection(relX, y, relZ);
	}
	var offset = this.getBlockOffset(relX, y, relZ);

	substr(section.Blocks, offset, 1) = chr(type);

	var byte = ord substr(section.Data, (offset/2), 1 );
	if (offset % 2 == 0 ) {
		byte = (byte&240) + funcType;
	} else {
		byte = funcType*16 + (byte&15);
	}

  substr(section.Data, (offset/2), 1) = chr(byte);

	this.changed = true;
};

Region.prototype.getBiome = function(relX, relZ) {
//	var (chunkX, chunkZ) = this.chunkXZ(relX,relZ);

  if (this.chunks[chunkZ][chunkX].chunk === undefined) {
    return;
  }

	var chunk = this.chunks[chunkZ][chunkX].chunk;
	var level = chunk.Level;
	var offset = this.getBiomeOffset(relX, relZ);

	return ord(substr(level.Biomes, offset, 1));
};

Region.prototype.setBiome = function(relX, relZ, type) {
	if (type != (type&255)) {
    throw('bad type passed to setBiome: type');
  }

	// var chunk_x, chunk_z = this.chunkXZ(relX,relZ);
	// var chunk_x, chunk_z = this.chunkXZ(relX,relZ);

	if (this.chunks[chunkZ][chunkX].chunk === undefined) {
		this.addChunk(chunkX, chunkZ);
	}
	var chunk = this.chunks[chunkZ][chunkX].chunk;
	var level = chunk.Level;
	var offset = this.getBiomeOffset(relX, relZ);

	substr(level.Biomes, offset, 1) = chr(type);

	this.changed = true;
};




// IO Functions

Region.prototype.fromFile = function(filename ) {
  // readFileSync()
	return this.fromString( data );
};

Region.prototype.toFile = function(filename ) {
  // writeFileSync()
};

Region.prototype.fromString = function(data) {
	this.data = data;
	this.offset = 0;
	this.length = data.length;

	for (var cZ = 0; cZ < 32; cZ++) {
		for (var cX = 0; cX < 32; cX++) {
 			this.offset = 4 * (cX + cZ * 32);
			var b1 = this.byte;
			var b2 = this.byte;
			var b3 = this.byte;
			var chunkOffset = (b1<<16) + (b2<<8) + (b3);

			if (chunkOffset === 0) {
        continue;
      };

 			this.offset = 4*32*32  + 4 * (cX + cZ * 32);
			var chunkTime = this.int32;

			this.offset = chunkOffset<<12;
			var chunkLength = this.int32;
			var compressionType = this.byte;
			var cZComp = substr(this.data, (chunkOffset <<12)+5, chunkLength-1);

			var chunk;
			if (compressionType === 1) {
//	  	gunzip cZComp => chunk;
			} else if (compressionType === 2) {
//  		chunk = uncompress(cZComp);
			} else {
				// open( var tmp, '>:bytes', '/tmp/comp.example' );
				// print {tmp} cZComp;
				// close tmp;
				throw('Unknown compression type ' + compressionType);
			}

			this.chunks[cZ][cX].chunk = NBT.fromString(chunk);
			this.chunks[cZ][cX].timestamp = chunkTime;
		}
	}

	return this;
};

// get basic values from stream
Region.prototype.get = function(n) {
	if (this.offset >= this.length) {
		console.log('out of data');
	}
	var v = substr(this.data, this.offset, n);
	this.offset += n;
	return v;
};

// get values from stream and reverse them IF the system is littlendian

Region.prototype.gete = function(n) {
	var chars = this.get(n);
	// assume little endian
	return chars.split('').reverse().join('');
};

Region.prototype.byte = function() {
	return ord(this.get(1));
};

Region.prototype.int32 = function() {
	var t1 = this.byte;
	var t2 = this.byte;
	var t3 = this.byte;
	var t4 = this.byte;
	return (t1<<24) + (t2<<16) + (t3<<8) + t4;
};

//*****************************************************************************

Region.prototype.toString = function() {
	var chunkOffset = 2;
	var offset = [];
	var timeData = [];
	var chunk_data = [];

	// turn each chunk into data
	for (var cZ = 0; cZ < 32; cZ++)	{
		for (var cX = 0; cX < 32; cX++) {
			if (this.chunks[cZ][cX] === undefined) {
				offset.push( chr(0).chr(0).chr(0).chr(0) );
				timeData.push( chr(0).chr(0).chr(0).chr(0) );
				continue;
			}
			var chunkTime = this.chunks[cZ][cX].timestamp;
			var chunkNBT = this.chunks[cZ][cX].chunk.toString();
			var cZCcomp = compress(chunkNBT);
			var length = length(cZComp) + 1;

			var chunk = chr((length>>24)&255).chr((length>>16)&255).chr((length>>8)&255).chr((length)&255);
			chunk += chr(2);
			chunk += c_zcomp;

			if (length(chunk) % 4096 != 0) {
				chunk += chr(0)x(4096-(length(chunk) % 4096));
			}

			if (length(chunk) % 4096 != 0) {
				throw ('math fail');
			}

			var sectors = length(chunk)/4096;

			chunkData.push(chunk);
			offset.push( chr((chunkOffset>>16)&255).chr((chunkOffset>>8)&255).chr((chunkOffset)&255).chr(sectors) );
			timeData.push( chr((chunkTime>>24)&255).chr((chunkTime>>16)&255).chr((chunkTime>>8)&255).chr((chunkTime)&255) );
			chunkOffset += sectors;
		}
	}

	return join('', offset, timeData, chunkData );
}
