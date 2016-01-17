
var fs = require('fs');
var zlib = require('zlib');
var Int64 = require('node-int64');

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
  fs.mkdirSync('saves/' + WORLD_NAME);
  fs.mkdirSync('saves/' + WORLD_NAME + '/region');
} catch(e) {}

//*****************************************************************************

var nbt = NBT.fromGzipFile('sample/level.dat');
/*
console.log('Setting World options');

nbt.tag.value.Data.value.LevelName.value = WORLD_NAME;
nbt.tag.value.Data.value.LastPlayed.value = new Int64('' + Date.now());

nbt.toGzipFile('saves/' + WORLD_NAME + '/level.dat');

/*
var world = new World('saves/' + WORLD_NAME);
var geojson = JSON.parse(fs.readFileSync('tile.json'));

rasterize(world, geojson);
*/