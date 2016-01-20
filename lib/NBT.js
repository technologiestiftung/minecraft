
var fs = require('fs');
var zlib = require('zlib');
var Long = require('Long');

var NBT = module.exports = function(buffer) {
  this.buffer = buffer;
  this.offset = 0;
  this.tag = this.getTag();
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

//*************************************

NBT.fromFile = function(file) {
  var str = fs.readFileSync(file);
  return new NBT(str);
};

NBT.fromGzipFile = function(file) {
  var data = fs.readFileSync(file);
  var str = zlib.gunzipSync(data);
  return new NBT(str);
};

NBT.createTag = function(type, name, value, itemType) {
  var tag = {
    type: type,
    name: name,
    value: value
  };

  if (type === NBT.LIST) {
    tag.itemType = itemType;
  }

  return tag;
};

//*************************************

NBT.prototype.getByte = function() {
  var byte = this.buffer.readInt8(this.offset);
  this.offset += 1;
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

NBT.prototype.getBuffer = function() {
  this.buffer = new Buffer(this.buffer.length + 5000); // TODO
  this.offset = 0;
  this.putTag(this.tag, true);

  return this.buffer.slice(0, this.offset);
};

NBT.prototype.toFile = function(file) {
  fs.writeFileSync(file, this.getBuffer());
};

NBT.prototype.toGzipFile = function(file) {
  fs.writeFileSync(file, zlib.gzipSync(this.getBuffer()));
};

//*************************************

NBT.prototype.putByte = function(byte) {
  this.buffer.writeInt8(byte, this.offset);
  this.offset += 1;
};

NBT.prototype.putString = function(str) {
  var b = new Buffer(str, 'utf8');
  var length = b.length;

  this.buffer.writeUInt16BE(length, this.offset);
  this.offset += 2;

  b.copy(this.buffer, this.offset);
  this.offset += length;
};

NBT.prototype.putTag = function(tag, needsName) {
   if (tag.type === NBT.END) {
     throw('Unexpected end');
   }

   console.log(tag.type);
 console.log('OFFSET', this.offset, this.buffer.length)

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
      var hi = tag.value.getHighBits();
      this.buffer.writeInt32BE(hi, this.offset);
      this.offset += 4;

      var lo = tag.value.getLowBits();
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
       var length = tag.value.length;
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
       var length = tag.value.length;;
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
       var length = tag.value.length;
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
