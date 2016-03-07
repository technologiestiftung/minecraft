
var fs = require('fs');

var Region = function(opts) {
  this.opts = opts;
};

Region.fromFile = function(filename, rx, rz) {
  var region = new Region({});

  region.data = fs.readFileSync(filename);
  region.offset = 0;
  region.length = region.data.length;
  region.opts.rx = rx;
  region.opts.rz = rz;

  for (var cz = 0; cz < 32; cz++) {
    for (var cx = 0; cx < 32; cx++) {
      region.offset = 4 * (cx + cz * 32);
      var b1 = region.byte();
      var b2 = region.byte();
      var b3 = region.byte();
      //var b4 = region.byte();
      var chunkOffset = (b1<<16) + (b2<<8) + (b3);
      //var chunkBits = b4;

      if (chunkOffset === 0) continue;

      region.offset = 4*32*32  + 4 * (cx + cz * 32);
      var chunkTime = region.int32();
	
      region.offset = chunkOffset<<12;
      var chunkLength = region.int32();
      var compressionType = region.byte();
//    var czComp = region.data.substr((chunkOffset<<12) + 5, chunkLength-1);
      var czComp = new Buffer(chunkLength-1 - ((chunkOffset<<12) + 5));
      region.data.copy(czComp, 0);

      var chunk;
      if (compressionType === 1) {
        //gunzip \c_zcomp => \chunk;
      } else if (compressionType === 2) {
        chunk = zlib.gunzipSync(czComp);
      } else {
        //open( var tmp, ">:bytes", "/tmp/comp.example" );
        //print {tmp} c_zcomp;
        //close tmp;
        throw 'Unknown compression type ' + compressionType;
      }

      cinsole.log(2340)

      region.cz.cx.timestamp = chunkTime;
      region.cz.cx.chunk = NBT.fromString(chunk);
    }
  }

  return region;
};

Region.prototype.byte = function() {
  if (this.offset >= this.length) {
    console.log('out of data');
  }
  this.offset++;
  return this.data.readUInt8(this.offset);
};

Region.prototype.int32 = function() {
  var t1 = this.byte();
  var t2 = this.byte();
  var t3 = this.byte();
  var t4 = this.byte();
  return (t1<<24) + (t2<<16) + (t3<<8) + t4;
};

Region.fromFile('BedRock/region/r.0.0.mca', 0, 0);
