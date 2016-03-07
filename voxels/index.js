
var zlib = require('zlib');
var fs = require('fs-extra');
var Long = require('long');
var NBT = require('node-nbt');

//use Minecraft;
//use Minecraft::Projection;
//use Minecraft::MapTiles;
//use Minecraft::Geometry;
//use Getopt::Long;

var yshift = 0;

var OPTS = {};

OPTS.FLATLAND = 0;
OPTS.FLOOD = 0;

var WORLD_NAME = 'TEST';
var bbox = { n:52.52097, e:13.40787, s:52.52017, w:13.40654 };

//var p1 = transform(bbox.e, bbox.n, 'EPSG4326');
//var p2 = transform(bbox.w, bbox.s, 'EPSG4326');
//if (p1.x > p2.x) {
//  (e2,e1)=(e1,e2);
//}
//if (p1.y > n2.y) {
//  (n2,n1)=(n1,n2);
//}

var p1 = { x: 1000, y: 1000 };
var p2 = { x: 1500, y: 1500 };

var X = p1.x <<0;
var Y = p1.y <<0;
OPTS.EAST1 = 0;
OPTS.EAST2 = (p2.x-p1.x) <<0;
OPTS.NORTH1 = 0;
OPTS.NORTH2 = -(p2.y-p1.y) <<0;

//*****************************************************************************

try {
  fs.mkdirSync('saves');
} catch(e) {}

try {
  fs.mkdirSync('saves/' + WORLD_NAME);
} catch(e) {}

try {
  fs.mkdirSync('saves/' + WORLD_NAME + '/region');
} catch(e) {}

fs.copySync('BedRock', 'saves/' + WORLD_NAME);

//*****************************************************************************

//if ("var" ) { mkdir( "var" ); }
//if ("var/geometry" ) { mkdir( "var/geometry" ); }
//if ("var/tmp" ) { mkdir( "var/tmp" ); }


function get(obj, key) {
  for (var i = 0; i < obj.val.length; i++) {
    if (obj.val[i].name === key) {
      return obj.val[i];
    }
  }
}

var data = fs.readFileSync('saves/' + WORLD_NAME + '/level.dat');

var nbt = NBT.NbtReader.readTag(zlib.gunzipSync(data));
//nbt = NbtReader.removeBufferKey(d);

var Data = get(nbt, 'Data')
var LastPlayed = get(Data, 'LastPlayed')

console.log(LastPlayed);

  data.val.Data.val.LevelName.val = WORLD_NAME;

  var l = new Long(Date.now());
  var hi = l.getHighBits();
  var lo = l.getLowBits();
  console.log(data.val.Data.val.LastPlayed.val);

  data.val.Data.val.LastPlayed.val = [hi, lo];
console.log(data.val.Data.val.LastPlayed.val);
  //NBT.toGzipFile('saves/' + WORLD_NAME + '/level.dat');
  //zlib.gzipSync(data)
  //fs.readFile('saves/' + WORLD_NAME + '/level.dat', function(err, data) {













    //var mc = new Minecraft('saves');
  //var world = mc.world(WORLD_NAME, function(region, cx, cz) {
  //	for (var off_z=0; off_z < 16; off_z++) {
  //		for (var off_x=0;off_x<16; off_x++ ) {
  //			region.set_block( cx*16+off_x, 0, cz*16+off_z, 7 ); // bedrock
  //		}
  //	}
  //});

  //OPTS.GEOMETRY = new Geometry({
  //  dir: 'var/geometry',
  //  url: 'http://data.osmbuildings.org/0.2/geocraft2016-02/area.json',
  //  bbox: bbox
  //});

  OPTS.EXTEND_DOWNWARDS = 9;
  OPTS.TOP_OF_WORLD = 254;
  OPTS.YSHIFT = yshift;

  //var p = new Projection(world, 0, 0, X, Y, 'EPSG4326');
  //p.render(OPTS);
