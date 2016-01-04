
var fs = require('fs');
var zlib = require('zlib');
var Long = require('long');
var nbt = require('prismarine-nbt');

var World = require('./lib/World.js');
// var Region  = require('./lib/Region.js');
var Projection = require('./lib/Projection.js');
var BLOCKS = require('./config/blocks.js');

//*****************************************************************************

var WORLD_NAME = 'TestBerlin01';

var ANCHOR_E = 0;
var ANCHOR_N = 0;

var options = {
  FLATLAND: 0,
  FLOOD: 0,
  BLOCKS: BLOCKS,
  MIN_HEIGHT: 0,
  MAX_HEIGHT: 256
};

//*****************************************************************************

try {
  fs.mkdirSync('saves');
  fs.mkdirSync('saves/' + WORLD_NAME);
} catch(e) {}

//*****************************************************************************

console.log('Setting World options');

fs.readFile('sample/level.dat', function(error, data) {
  nbt.parse(data, function(err, data) {

    data.value.Data.value.LevelName.value = WORLD_NAME;

    var long = Long.fromString('' + Date.now(), true);
    data.value.Data.value.LastPlayed.value = [long.high, long.low];

    fs.writeFileSync('saves/' + WORLD_NAME + '/level.dat', zlib.gzipSync(nbt.writeUncompressed(data)));

    var world = new World('saves/' + WORLD_NAME);
    var proj = new Projection(world, 0, 0, ANCHOR_E, ANCHOR_N);

    // options.MAPTILES = new MapTiles();
    // options.ELEVATION = new Elevation();

    proj.render(options);
  });
});
