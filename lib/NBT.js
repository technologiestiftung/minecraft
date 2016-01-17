
var fs = require('fs');
var zlib = require('zlib');
var Int64 = require('node-int64');

var NBT = module.exports = function(buffer) {
  this.buffer = buffer;
  this.offset = 0;
  this.tag = this.getTag();
};

//*************************************

NBT.TYPES = {
  0:  'END',
  1:  'BYTE',
  2:  'SHORT',
  3:  'INT',
  4:  'LONG',
  5:  'FLOAT',
  6:  'DOUBLE',
  7:  'BYTE_ARRAY',
  8:  'STRING',
  9:  'LIST',
  10: 'COMPOUND',
  11: 'INT_ARRAY'
};

NBT.fromFile = function(file) {
  var str = fs.readFileSync(file);
  return new NBT(str);
};

NBT.fromGzipFile = function(file) {
  var data = fs.readFileSync(file);
  var str = zlib.gunzipSync(data);
  return new NBT(str);
};

//*************************************

NBT.prototype.getByte = function() {
  var byte = this.buffer.readUInt8(this.offset);
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
  return this.typedTag(type, true);
};

NBT.prototype.typedTag = function(type, needsName) {
  console.log(NBT.TYPES[type]);

  if (type === 0) {
    return;
  }

  var tag = {
    type: type,
  }

  if (needsName) {
    tag.name = this.getString();
  }

  switch (type) {
    case 1:
      tag.value = this.getByte();
      return tag;

    case 2:
      tag.value = this.buffer.readInt16BE(this.offset);
      this.offset += 2;
      return tag;

    case 3:
      tag.value = this.buffer.readInt32BE(this.offset);
      this.offset += 4;
      return tag;

    case 4:
      var hi = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      var lo = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = new Int64(hi, lo);
      return tag;

    case 5:
      tag.value = this.buffer.readFloatBE(this.offset);
      this.offset += 4;
      return tag;

    case 6:
      tag.value = this.buffer.readDoubleBE(this.offset);
      this.offset += 8;
      return tag;

    case 7:
      var length = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = [];
      for (var i = 0; i < length; i++) {
        tag.value[i] = this.getByte();
      }
      return tag;

    case 8:
      tag.value = this.getString();
      return tag;

    case 9:
      tag.listType = this.getByte();

      var length = this.buffer.readInt32BE(this.offset);
      this.offset += 4;

      tag.value = [];
      for (var i = 0; i < length; i++) {
        tag.value[i] = this.typedTag(tag.listType);
      }
      return tag;

    case 10:
      tag.value = {};
      while (1) {
        var child = this.getTag();
        if (child === undefined) {
          return tag;
        }
        tag.value[ child.name ] = child;
      }

    case 11:
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

// NBT.prototype.toString = function() {
//   return '';
//   // this.buffer = new Buffer(this.buffer.length+10000);
//   // this.offset = 0;
//   // this.putTag(this.tag, true);
//   // this.putByte(0); // End
//   // return this.buffer;
// };

// NBT.prototype.toFile = function(file) {
//   fs.writeFileSync(file, this.toString());
// };

// NBT.prototype.toGzipFile = function(file) {
//   fs.writeFileSync(file, zlib.gzipSync(this.toString()));
// };

// //*************************************

// NBT.prototype.putByte = function(byte) {
//   this.buffer.writeUInt8(byte, this.offset);
//   this.offset += 1;
// };

// NBT.prototype.putString = function(str) {
//   var length = str.length;
//   this.buffer.writeUInt16BE(length, this.offset);
//   this.offset += 2;

//   this.buffer.write(str, this.offset, length, 'utf8');
//   this.offset += length;
// };

// NBT.prototype.putTag = function(tag, needsName) {
//   if (tag.type === 0) {
//     throw('Unexpected end');
//   }

//   console.log(NBT.TYPES[tag.type]);

//   if (needsName) {
//     this.putByte(tag.type);
//     this.putString(tag.name);
//   }

//   switch (tag.type) {
//     case 1:
//       this.putByte(tag.value);
//       return;

//     case 2:
//       this.buffer.writeInt16BE(this.offset, tag.value);
//       this.offset += 2;
//       return;

//     case 3:
//       this.buffer.writeInt32BE(this.offset, tag.value);
//       this.offset += 4;
//       return;

//     case 4:
//       tag.value.copy(this.buffer, this.offset);
//       this.offset += 8;
//       return;

//     case 5:
//       this.buffer.writeFloatBE(this.offset, tag.value);
//       this.offset += 4;
//       return;

//     case 6:
//       this.buffer.writeDoubleBE(this.offset, tag.value);
//       this.offset += 8;
//       return;

//     case 7:
//       var length = tag.value.length;
//       this.buffer.writeInt32BE(length, this.offset);
//       this.offset += 4;

//       for (var i = 0; i < length; i++) {
//          this.putByte(tag.value[i]);
//       }
//       return;

//     case 8:
//       this.putString(tag.value);
//       return;

//     case 9:
//       this.putByte(tag.listType); // ??
//       var length = tag.value.length;;
//       this.buffer.writeInt32BE(length, this.offset);
//       this.offset += 4;

//       for (var i = 0; i < length; i++) {
//         this.putTag(tag.value[i], false);
//       }
//       return;

//     case 10:
//       for (var key in tag.value) {
//         if (tag.value[key].type && tag.value[key].value !== undefined) {
//           this.putTag(tag.value[key], true);
//         }
//       }
//       return;

//     case 11:
//       var length = tag.value.length;
//       this.buffer.writeInt32BE(length, this.offset);
//       this.offset += 4;

//       for (var i = 0; i < length; i++) {
//         this.buffer.writeInt32BE(tag.value[i], this.offset);
//         this.offset += 4;
//       }
//       return;
//   }

//   console.log('Unknown tag type', tag.type);
// };
