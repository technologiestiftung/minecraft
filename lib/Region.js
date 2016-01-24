/* global 4096 */

var fs = require('fs');
var zlib = require('zlib');

var NBT = require('./NBT.js');
var Long = require('Long');

//*****************************************************************************

function arrayFill(v, num) {
  var res = [];
  for (var i = 0; i < num; i++) {
    res[i] = v;
  }
  return res;
}

// var INCREMENT = 1024;

// function ensureSize(size) {
// 	var neededSize = this.offset + size - this.buffer.size;
// 	if (neededSize >= 0) {
// 		var oldBuffer = this.buffer;
// 		this.buffer = new Buffer(this.buffer.length + Math.ceil(neededSize / INCREMENT) * INCREMENT);
// 		oldBuffer.copy(this.buffer);
// 	}
// }

//*****************************************************************************

var Region = module.exports = function(buffer) {
  this.chunks = {};
};

//*****************************************************************************

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
    throw('Bad type passed to setBlock: ' + type);
  }

	if (subtype !== (subtype & 15) ) {
    throw('Bad subtype passed to setBlock: ' + subtype);
  }

  var section = this.getBlockSection(x, y, z);
  if (section === undefined) {
    return this.addSection(x, y, z);
	}

	var offset = this.getBlockOffset(x, y, z);
  section.value.Blocks.value[offset] = type;

	// set subtype
	var byte = section.value.Data.value[offset/2];
	if (offset % 2 === 0 ) {
		byte = (byte & 240) + subtype;
	} else {
		byte = subtype * 16 + (byte & 15);
	}
  section.value.Data.value[offset/2] = byte;

	this.changed = true;
};

Region.prototype.getBlockSection = function(x, y, z) {
  var c = this.getChunk(x, z);
  if (this.chunks[c.z]) {
	  var chunk = this.chunks[c.z][c.x];
  }

	if (chunk === undefined) {
    return;
	}

	var sectionY = y/16 <<0;
	var sections = chunk.value.Level.value.Sections;
	return sections[sectionY];
};

Region.prototype.addSection = function(x, y, z) {
  var c = this.getChunk(x, z);

	if (this.chunks[c.z] === undefined || this.chunks[c.z][c.x] === undefined) {
		this.addChunk(c.x, c.z);
	}

	var chunk = this.chunks[c.z][c.x];
	var sections = chunk.value.Level.value.Sections;

	var sectionY = y/16 <<0;

	for (var i = 0; i <= sectionY; i++) {
		if (sections.value[i] !== undefined) {
      continue;
    }

    var value = {
		  Y:          new NBT.Tag(NBT.BYTE,       'Y',          i),
		  Blocks:     new NBT.Tag(NBT.BYTE_ARRAY, 'Blocks',     arrayFill(0, 4096)),
		  BlockLight: new NBT.Tag(NBT.BYTE_ARRAY, 'BlockLight', arrayFill(0, 2048)),
		  SkyLight:   new NBT.Tag(NBT.BYTE_ARRAY, 'SkyLight',   arrayFill(255, 2048)),
		  Data:       new NBT.Tag(NBT.BYTE_ARRAY, 'Data',       arrayFill(0, 2048))
    };

		sections.value[i] = new NBT.Tag(NBT.COMPOUND, '', value);
	}

	this.changed = true;

	return sections.value[i-1];
};

Region.prototype.getChunk = function(x, z) {
	return { x:x/16 <<0, z:z/16 <<0 };
};

Region.prototype.addChunk = function(x, z) {

  var value = {
    TerrainPopulated: new NBT.Tag(NBT.BYTE,       'TerrainPopulated', 1),
    Biomes:           new NBT.Tag(NBT.BYTE_ARRAY, 'Biomes',           arrayFill(0, 256)),
    xPos:             new NBT.Tag(NBT.INT,        'xPos',             x),
    zPos:             new NBT.Tag(NBT.INT,        'zPos',             z),
    LightPopulated:   new NBT.Tag(NBT.BYTE,       'LightPopulated',   0),
    Entities:         new NBT.Tag(NBT.LIST,       'Entities',         [], 10),
    TileEntities:     new NBT.Tag(NBT.LIST,       'TileEntities',     [], 10),
    LastUpdate:       new NBT.Tag(NBT.LONG,       'LastUpdate',       0),
    HeightMap:        new NBT.Tag(NBT.INT_ARRAY,  'HeightMap',        []),
    Sections:         new NBT.Tag(NBT.LIST,       'Sections',         [], 10)
  };

	var level = new NBT.Tag(NBT.COMPOUND, 'Level', value);

  if (this.chunks[z] === undefined) {
    this.chunks[z] = {};
  }

  this.chunks[z][x] = new NBT.Tag(NBT.COMPOUND, '', { Level:level });
  this.chunks[z][x].timestamp = Date.now();

	this.changed = true;
};

Region.prototype.getBlockOffset = function(x, y, z) {
 	var localX = x & 15;
  var localY = y & 15;
 	var localZ = z & 15;
 	return 16*16*localY + 16*localZ + localX;
};

// collect chunks into one buffer
Region.prototype.chunksToBuffer = function() {
  var dataBuffer = new Buffer(1024*1024); // TODO
  var dataBufferOffset = 0;

  var offsetBuffer = new Buffer(1024*1024); // TODO
  var offsetBufferOffset = 0;

  var timeBuffer = new Buffer(1024*1024); // TODO
  var timeBufferOffset = 0;


	var chunkOffset = 2;

	for (var z = 0; z < 32; z++)	{
		for (var x = 0; x < 32; x++) {
 			if (this.chunks[z] === undefined || this.chunks[z][x] === undefined) {
        offsetBuffer.writeInt32BE(0, offsetBufferOffset);
        offsetBufferOffset += 4;

        timeBuffer.writeInt32BE(0, timeBufferOffset);
        timeBufferOffset += 4;

       	continue;
 			}

 			var chunkBuffer = NBT.toBuffer(this.chunks[z][x]);
 			var chunkTime   = this.chunks[z][x].timestamp;
   		var compressed  = zlib.gzipSync(chunkBuffer);
 			var length = compressed.length + 1;

      var dataBufferOffsetBefore = dataBufferOffset;

// 	  var chunk = ((length >>24) & 255) + ((length >>16) & 255) + ((length >>8) & 255) + ((length) & 255) + 2; <== compression type
// 	  chunk += compressed;

      dataBuffer.writeInt32BE(length, dataBufferOffset);
      dataBufferOffset += 4;

      dataBuffer.writeInt8(2, dataBufferOffset);
      dataBufferOffset++;

      compressed.copy(dataBuffer, dataBufferOffset);
      dataBufferOffset += compressed.length;

 			if (dataBuffer.length % 4096 !== 0) {
        var num = 4096 - (dataBuffer.length % 4096);
        for (var i = 0; i < num; i++) {
          dataBuffer.writeInt8(0, dataBufferOffset);
          dataBufferOffset++;
        }
 			}

 			var sectors = (dataBufferOffset-dataBufferOffsetBefore)/4096;

 			// offsetData.push(((chunkOffset >>16) & 255) + ((chunkOffset >>8) & 255) + ((chunkOffset) & 255) + (sectors));
      offsetBuffer.writeInt32BE(chunkOffset, offsetBufferOffset);
      offsetBufferOffset += 4;

      offsetBuffer.writeInt8(sectors, offsetBufferOffset);
      offsetBufferOffset++;

 			// timeData.push(((chunkTime >>24) & 255) + ((chunkTime  >>16) & 255) + ((chunkTime >>8) & 255) + ((chunkTime) & 255));
      // timeBuffer.writeInt32BE(chunkTime, timeBufferOffset);
      // timeBufferOffset += 4;

      var v = new Long(chunkTime);

      var hi = v.getHighBits();
      timeBuffer.writeInt32BE(hi, timeBufferOffset);
      timeBufferOffset += 4;

      var lo = v.getLowBits();
      timeBuffer.writeInt32BE(lo, timeBufferOffset);
      timeBufferOffset += 4;

 			chunkOffset += sectors;
 		}
 	}

  var buffer = new Buffer(offsetBufferOffset+timeBufferOffset+dataBufferOffset);
  var offset = 0;

  offsetBuffer.copy(buffer, offset);
  offset += offsetBufferOffset;

  timeBuffer.copy(buffer, offset);
  offset += timeBufferOffset;

  offsetBuffer.copy(buffer, offset);
  offset += offsetBufferOffset;

  return buffer;
};

Region.prototype.save = function(file) {
  fs.writeFileSync(file, this.chunksToBuffer());
  this.changed = false;
};
