
var fs = require('fs');
var zlib = require('zlib');
var Long = require('Long');

//*************************************

var NBT = module.exports = function(buffer) {
  this.buffer = buffer || new Buffer(1024*1024); // TODO
  this.offset = 0;
};

NBT.prototype.getBuffer = function() {
  return this.buffer.slice(0, this.offset);
};

//*************************************

NBT.END = 0;
NBT.BYTE = 1;
NBT.SHORT = 2;
NBT.INT = 3;
NBT.LONG = 4;
NBT.FLOAT = 5;
NBT.DOUBLE = 6;
NBT.BYTE_ARRAY = 7;
NBT.STRING = 8;
NBT.LIST = 9;
NBT.COMPOUND = 10;
NBT.INT_ARRAY = 11;

NBT.fromFile = function(file) {
  var buffer = fs.readFileSync(file);
  var nbt = new NBT(buffer);
  return nbt.getTag();
};

NBT.fromGzipFile = function(file) {
  var buffer = zlib.gunzipSync(fs.readFileSync(file));
  var nbt = new NBT(buffer);
  return nbt.getTag();
};

NBT.toFile = function(file, tag) {
  var nbt = new NBT();
  nbt.putTag(tag, true);
  fs.writeFileSync(file, nbt.getBuffer());
};

NBT.toGzipFile = function(file, tag) {
  var nbt = new NBT();
  nbt.putTag(tag, true);
  fs.writeFileSync(file, zlib.gzipSync(nbt.getBuffer()));
};

NBT.toBuffer = function(tag) {
  var nbt = new NBT();
  nbt.putTag(tag, true);
  return nbt.getBuffer();
};

//*************************************

NBT.prototype.getByte = function() {
  var byte = this.buffer.readUInt8(this.offset);
  this.offset++;
  return byte;
};

NBT.prototype.getString = function() {
  var length = this.buffer.readUInt16BE(this.offset);
  this.offset += 2;

  var str = this.buffer.toString('utf8', this.offset, this.offset + length);
  this.offset += length;

  // console.log('"' + str + '"')
  return str;
};

NBT.prototype.getTag = function() {
  var type = this.getByte();
  return this.getTypedTag(type, true);
};

NBT.prototype.getTypedTag = function(type, needsName) {
  // console.log(type);

  // has to stay here
  if (type === NBT.END) {
    return;
  }

  var tag = {
    type: type
  };

  if (needsName) {
    tag.name = this.getString();
  }

  switch (type) {
    case NBT.BYTE:
      tag.value = this.getByte();
      return tag;

    case NBT.SHORT:
      tag.value = this.buffer.readInt16BE(this.offset);
      this.offset += 2;
      return tag;

    case NBT.INT:
      tag.value = this.buffer.readInt32BE(this.offset);
      this.offset += 4;
      return tag;

    case NBT.LONG :
      var hi = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      var lo = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = new Long(hi, lo);
      return tag;

    case NBT.FLOAT:
      tag.value = this.buffer.readFloatBE(this.offset);
      this.offset += 4;
      return tag;

    case NBT.DOUBLE:
      tag.value = this.buffer.readDoubleBE(this.offset);
      this.offset += 8;
      return tag;

    case NBT.BYTE_ARRAY:
      var length = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = [];
      for (var i = 0; i < length; i++) {
        tag.value[i] = this.getByte();
      }
      return tag;

    case NBT.STRING:
      tag.value = this.getString();
      return tag;

    case NBT.LIST:
      tag.itemType = this.getByte();

      var length = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = [];
      for (var i = 0; i < length; i++) {
        tag.value[i] = this.getTypedTag(tag.itemType);
      }
      return tag;

    case NBT.COMPOUND:
      tag.value = {};
      while (1) {
        var child = this.getTag();
        if (child === undefined) {
          return tag;
        }
        tag.value[ child.name ] = child;
      }

    case NBT.INT_ARRAY:
      var length = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = [];
      for (var i = 0; i < length; i++) {
        tag.value[i] = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
      }
      return tag;
  }

  throw('Unknown tag type ' + type);
};

//*************************************

NBT.prototype.putByte = function(byte) {
  this.buffer.writeUInt8(byte, this.offset);
  this.offset++;
};

NBT.prototype.putString = function(str) {
  var strBuffer = new Buffer(str, 'utf8');
  var length = strBuffer.length;

  this.buffer.writeUInt16BE(length, this.offset);
  this.offset += 2;

  strBuffer.copy(this.buffer, this.offset);
  this.offset += length;
};

NBT.prototype.putTag = function(tag, needsName) {
  var length;

  if (tag.type === NBT.END) {
    throw('Unexpected end');
  }

// console.log(tag.type);
// console.log('OFFSET', this.offset, this.buffer.length)

  if (needsName) {
    this.putByte(tag.type);
    this.putString(tag.name);
  }

  switch (tag.type) {
    case NBT.BYTE:
      this.putByte(tag.value);
      return;

    case NBT.SHORT:
      this.buffer.writeInt16BE(tag.value, this.offset);
      this.offset += 2;
      return;

    case NBT.INT:
      this.buffer.writeInt32BE(tag.value, this.offset);
      this.offset += 4;
      return;

    case NBT.LONG:
      var value = (tag.value.getHighBits !== undefined) ? tag.value : new Long(tag.value);

      var hi = value.getHighBits();
      this.buffer.writeInt32BE(hi, this.offset);
      this.offset += 4;

      var lo = value.getLowBits();
      this.buffer.writeInt32BE(lo, this.offset);
      this.offset += 4;
      return;

    case NBT.FLOAT:
      this.buffer.writeFloatBE(tag.value, this.offset);
      this.offset += 4;
      return;

    case NBT.DOUBLE:
      this.buffer.writeDoubleBE(tag.value, this.offset);
      this.offset += 8;
      return;

    case NBT.BYTE_ARRAY:
      length = tag.value.length;
      this.buffer.writeInt32BE(length, this.offset);
      this.offset += 4;
      for (var i = 0; i < length; i++) {
        this.putByte(tag.value[i]);
      }
      return;

    case NBT.STRING:
      this.putString(tag.value);
      return;

    case NBT.LIST:
      this.putByte(tag.itemType);
      length = tag.value.length;;
      this.buffer.writeInt32BE(length, this.offset);
      this.offset += 4;
      for (var i = 0; i < length; i++) {
        this.putTag(tag.value[i]);
      }
      return;

    case NBT.COMPOUND:
      for (var key in tag.value) {
        if (tag.value[key].type !== undefined && tag.value[key].value !== undefined) {
          this.putTag(tag.value[key], true);
        }
      }
      this.putByte(0); // End
      return;

    case NBT.INT_ARRAY:
      length = tag.value.length;
      this.buffer.writeInt32BE(length, this.offset);
      this.offset += 4;
      for (var i = 0; i < length; i++) {
        this.buffer.writeInt32BE(tag.value[i], this.offset);
        this.offset += 4;
      }
      return;
  }

  console.log('Unknown tag type', tag.type);
};

//*************************************

NBT.Tag = function(type, name, value, itemType) {
  this.type  = type;
  this.name  = name;
  this.value = value;
  if (type === NBT.LIST) {
    this.itemType = itemType;
  }
};
