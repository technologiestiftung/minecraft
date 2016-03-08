
var zlib = require('zlib');
var fs = require('fs-extra');
var Long = require('long');
var NBT = require('nbt');
var World = require('./lib/World.js');
var Transform = require('./lib/Transform.js');
var Rasterizer = require('./lib/Rasterizer.js');

//*****************************************************************************

var worldName = 'NANANA';
var bbox = { n:52.52097, e:13.40787, s:52.52017, w:13.40654 };

var p1 = Transform.toXY(bbox.e, bbox.n, 'EPSG4326');
var p2 = Transform.toXY(bbox.w, bbox.s, 'EPSG4326');

var x = Math.min(p1.x, p2.x);
var y = Math.min(p1.y, p2.y);

var options = {};
options.sizeX = Math.abs(p2.x-p1.x) <<0;
options.sizeY = Math.abs(p2.y-p1.y) <<0;

//*****************************************************************************

try {
  fs.mkdirSync('saves');
} catch(e) {}

try {
  fs.mkdirSync('saves/' + worldName);
} catch(e) {}

try {
  fs.mkdirSync('saves/' + worldName + '/region');
} catch(e) {}

fs.copySync('BedRock', 'saves/' + worldName);

//*****************************************************************************

var data = zlib.gunzipSync(fs.readFileSync('saves/' + worldName + '/level.dat'));

var nbt = NBT.parse(data, function(err, nbt) {
  nbt.value.Data.value.LevelName.value = worldName;

  var l = Long.fromNumber(Date.now(), true);
  var hi = l.getHighBits();
  var lo = l.getLowBits();
  nbt.value.Data.value.LastPlayed.value = [hi, lo];

  var buffer = NBT.writeUncompressed(nbt);

  fs.writeFileSync('saves/' + worldName + '/level.dat', zlib.gzipSync(buffer));

  var world = new World('saves/' + worldName);

  // TODO: world's level is read async(?)

  new Rasterizer({
    world: world,
    x: x,
    y: y,
    sizeX: sizeY,
    sizeY: sizeX,
    dir: 'var/geometry',
    url: 'http://data.osmbuildings.org/0.2/geocraft2016-02/area.json',
    bbox: bbox
  });

});
