
var fs = require('fs');

var NBT = require('./lib/NBT.js');
var World = require('./lib/World.js');
var rasterize = require('./lib/Rasterizer.js');

//*****************************************************************************

var WORLD_NAME = 'TestBerlin01';

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

var level = NBT.fromGzipFile('sample/level.dat');
level.value.Data.value.LevelName.value = WORLD_NAME;
level.value.Data.value.LastPlayed.value = Date.now();
NBT.toGzipFile('saves/' + WORLD_NAME + '/level.dat', level);

var world = new World('saves/' + WORLD_NAME);
var geojson = JSON.parse(fs.readFileSync('data/tile.json'));

rasterize(world, geojson);

console.log('done');