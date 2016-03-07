
var fs = require('fs');
var zlib = require('zlib');
var NBT = require('nbt');

//*****************************************************************************

function arrayFill(item, num) {
  var res = [];
  for (var i = 0; i < num; i++) {
    res[i] = (item === undefined) ? i : item;
  }
  return res;
}

function address(x) {
  return x/16 <<0;
}

//*****************************************************************************

// coordinates are relative to the region

var Region = module.exports = function(rx, rz) {
  this.rx = rx;
  this.rz = rz;
  this.chunks = {};
};

Region.prototype.getSection = function(relX, y, relZ) {
  // work out which chunk
  var cx = address(relX);
  var sectionY = address(y);
  var cz = address(relZ);

  if (this.chunks[cz] === undefined || this.chunks[cz][cx] === undefined) {
    return;
  }

  var level = this.chunks[cz][cx].level;
  return level.value.Sections.value.value[sectionY];
};

Region.prototype.addSection = function(relX, y, relZ) {
	// work out which chunk
  var cx = address(relX);
  var cz = address(relZ);

  if (this.chunks[cz] === undefined) {
    this.chunks[cz] = {};
  }

	if (this.chunks[cz][cx] === undefined){
    this.chunks[cz][cx] = this.createChunk(cx, cz);
    this.changed = 1;
	}

	var level = this.chunks[cz][cx].level;
	var sectionY = address(y);

	for (var i = 0; i <= sectionY; i++) {
   if (level.value.Sections.value.value[i] !== undefined) {
      continue;
    }

    // if compound is a list item, no type / value properties are used
    level.value.Sections.value.value[i] = {
      Y:          { type:'byte', value:i },
      Blocks:     { type:'byteArray', value:arrayFill(0, 4096) },
      BlockLight: { type:'byteArray', value:arrayFill(0, 2048) },
      SkyLight:   { type:'byteArray', value:arrayFill(255, 2048) },
      Data:       { type:'byteArray', value:arrayFill(0, 2048) }
    };
	}

	this.changed = 1;

  return level.value.Sections.value.value[sectionY];
};

Region.prototype.createChunk = function(cx, cz) {
  var level = {
    type: 'compound',
    value: {
      TerrainPopulated: { type: 'byte', value: 1 },
      Biomes:           { type: 'byteArray', value: arrayFill(0, 256) },
      xPos:             { type: 'int', value: this.rx*32 + cx },
      zPos:             { type: 'int', value: this.rz*32 + cz },
      LightPopulated:   { type: 'byte', value: 1 },
      Entities:         { type: 'list', value: { value: [], type: 'compound' } },
      TileEntities:     { type: 'list', value: { value: [], type: 'compound' } },
      LastUpdate:       { type: 'long', value: [0, 0] },
      HeightMap:        { type: 'intArray', value: arrayFill(0, 255) },
      Sections:         { type: 'list', value: { value: [], type: 'compound' } }
    }
  };

  return {
  	timestamp: Date.now(),
    level: level
  };
};

//Region.prototype.addLayer = function(y, blockType) {
//	for (var relZ = 0; relZ < 512; relZ++) {
//		for (var relX = 0; relX < 512; relX++) {
//			this.setBlock(relX, y, relZ, blockType);
//		}
//	}
//};

// Coordinates are relative to Region

Region.prototype.getBlockOffset = function(relX, y, relZ) {
	var localX = relX & 15;
	var localY = y & 15;
	var localZ = relZ & 15;
	return 16*16*localY + 16*localZ + localX;
};

//Region.prototype.getBlock = function(relX, y, relZ) {
//	var section = this.getSection(relX, y, relZ);
//	if (!section) {
//    return 0;
//  }
//	var offset = this.getBlockOffset(relX, y, relZ);
//	return section.Blocks.value[offset];
//};

Region.prototype.setBlock = function(relX, y, relZ, type) {
	var subType = 0;
	if (typeof type === 'string') {
    var t = type.split('.');
    type = parseInt(t[0], 10);
    subType = parseInt(t[1], 10);
		if (subType === 1) {
      subType = 10;
    }
	}

	if (type !== (type & 255)) {
    throw 'bad type passed to setBlock() ' + type;
  }

	if (subType !== (subType & 15)) {
    throw 'bad subType passed to setBlock() ' + subType;
  }

	var section = this.getSection(relX, y, relZ);
	if (!section) {
		section = this.addSection(relX, y, relZ);
	}

	var offset = this.getBlockOffset(relX, y, relZ);
	section.Blocks.value[offset] = type;

	// set subType
	var byte = section.Data.value[offset/2];
	if (offset % 2 === 0)	{
    byte = (byte & 240) + subType;
	}	else 	{
    byte = subType*16 + (byte & 15);
	}
	section.Data.value[offset/2] = byte;

	this.changed = 1;
};

Region.prototype.save = function(filename) {
  var offset = 2;

  var chunkOffsets = new Buffer(4096);
  chunkOffsets.pos = 0;
  chunkOffsets.fill(0);

  var chunkTimestamps = new Buffer(4096);
  chunkTimestamps.pos = 0;
  chunkTimestamps.fill(0);

	var chunkBuffers = [];

	for (var cz = 0; cz < 32; cz++) {
    if (this.chunks[cz] === undefined) {
      this.chunks[cz] = {};
    }

		for (var cx = 0; cx < 32; cx++) {
			if (this.chunks[cz][cx] === undefined) {
        chunkOffsets.pos += 4;
        chunkTimestamps.pos += 4;
				continue;
			}

      var nbtBuffer = NBT.writeUncompressed({ name:'', value:{ 'Level':this.chunks[cz][cx].level }});
			var dataCompr = zlib.zipSync(nbtBuffer);
var dataCompr = new Buffer(0);
			var chunkLength = dataCompr.length;

      var numSectors = Math.ceil((4 + chunkLength) / 4096);
      var chunk = new Buffer(numSectors*4096);
      chunk.fill(0);

      chunk.writeUInt8((chunkLength>>24) & 255, 0);
      chunk.writeUInt8((chunkLength>>16) & 255, 1);
      chunk.writeUInt8((chunkLength>> 8) & 255, 2);
      chunk.writeUInt8((chunkLength)     & 255, 3);

      chunk.writeUInt8(2, 4); // compression type

      dataCompr.copy(chunk, 5);

			chunkBuffers.push(chunk);

      chunkOffsets.writeUInt8((offset>>16) & 255, chunkOffsets.pos++);
      chunkOffsets.writeUInt8((offset>> 8) & 255, chunkOffsets.pos++);
      chunkOffsets.writeUInt8((offset)     & 255, chunkOffsets.pos++);
      chunkOffsets.writeUInt8(numSectors, chunkOffsets.pos++);

      offset += numSectors;

      chunkTimestamps.writeUInt8((offset>>24) & 255, chunkTimestamps.pos++);
      chunkTimestamps.writeUInt8((offset>>16) & 255, chunkTimestamps.pos++);
      chunkTimestamps.writeUInt8((offset>> 8) & 255, chunkTimestamps.pos++);
      chunkTimestamps.writeUInt8((offset)     & 255, chunkTimestamps.pos++);
		}
	}

  var buffer = Buffer.concat([
    chunkOffsets,
    chunkTimestamps,
    Buffer.concat(chunkBuffers)
  ]);

  fs.writeFileSync(filename, buffer);
};

Region.fromFile = function(filename, rx, rz) {
  var region = new Region(rx, rz);

  var data = fs.readFileSync(filename);
  var offset, b1, b2, b3;

  for (var cz = 0; cz < 32; cz++) {
    for (var cx = 0; cx < 32; cx++) {
      offset = 4 * (cx + cz * 32);

      b1 = data.readUInt8(offset+0);
      b2 = data.readUInt8(offset+1);
      b3 = data.readUInt8(offset+2);

      var chunkOffset = (b1<<16) + (b2<<8) + (b3);

      if (chunkOffset === 0) {
        continue;
      }

      offset = 4 * (cx + cz * 32) + 4096;
      var chunkTime = data.readUInt32BE(offset);

      offset = chunkOffset * 4096;
      var chunkLength = data.readUInt32BE(offset);

      offset = chunkOffset * 4096 + 4;
      var compressionType = data.readUInt8(offset);

      var compr = new Buffer(chunkLength-1);

      data.copy(compr, 0, chunkOffset*4096 + 5, chunkOffset*4096 + 5 + (chunkLength-1));
      //data.copy(compr, targetStart, sourceStart,  sourceEnd);

      var chunk;
      if (compressionType === 2) {
        chunk = zlib.unzipSync(compr);
      } else {
        throw 'Unsupported compression type ' + compressionType;
      }

      if (region.chunks[cz] === undefined) {
        region.chunks[cz] = {};
      }

      NBT.parse(chunk, function(err, nbt) {
        region.chunks[cz][cx] = {
          timestamp: chunkTime,
          data: nbt
        };

        console.log(JSON.stringify(nbt))
      });
    }
  }

  return region;
};
