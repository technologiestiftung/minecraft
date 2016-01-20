
var fs = require('fs');
var long = require('long');

var NBT = require('./lib/NBT.js');
var World = require('./lib/World.js');
var rasterize = require('./lib/Rasterizer.js');

//*****************************************************************************

var WORLD_NAME = 'TestBerlin01';

var ORIGIN_X = 0;
var ORIGIN_Y = 0;

var SIZE_X = 0;
var SIZE_Y = 0;

// var options = {
//   FLATLAND: 0,
//   FLOOD: 0
// };

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

//*****************************************************************************

console.log('Setting World options');

var nbt = NBT.fromGzipFile('sample/level.dat');
nbt.tag.value.Data.value.LevelName.value = WORLD_NAME;
nbt.tag.value.Data.value.LastPlayed.value = long.fromNumber(Date.now());
nbt.toGzipFile('saves/' + WORLD_NAME + '/level.dat');

var world = new World('saves/' + WORLD_NAME);
var geojson = JSON.parse(fs.readFileSync('tile.json'));

rasterize(world, geojson);
