
var fs = require('fs');

var rasterize = require('./lib/Rasterizer.js');

//*****************************************************************************

var EARTH_RADIUS_IN_METERS = 6378137;
var EARTH_CIRCUMFERENCE_IN_METERS = EARTH_RADIUS_IN_METERS * Math.PI * 2;
var METERS_PER_DEGREE_LATITUDE  = EARTH_CIRCUMFERENCE_IN_METERS / 360;
var METERS_PER_DEGREE_LONGITUDE = EARTH_CIRCUMFERENCE_IN_METERS / 360; // this should vary by given latitude

//*****************************************************************************

var geojson = JSON.parse(fs.readFileSync('data/tile.json'));
var blocks = rasterize(geojson, true);

var position = { latitude: 52.52, longitude: 13.37 };

var stream = fs.createWriteStream('raster.geo.json');

var str = '{"type":"FeatureCollection","features":[';

for (var i = 0; i < blocks.length; i++) {
  blocks[i].x * METERS_PER_DEGREE_LATITUDE  + position.latitude;
  blocks[i].y * METERS_PER_DEGREE_LONGITUDE + position.longitude;

  var feature = {
    type: 'Feature',
    properties: {
      minHeight:blocks[i].z0,
      height:blocks[i].z1
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [ blocks[i].x    / METERS_PER_DEGREE_LONGITUDE + position.longitude,  blocks[i].y    / METERS_PER_DEGREE_LATITUDE + position.latitude],
        [(blocks[i].x+1) / METERS_PER_DEGREE_LONGITUDE + position.longitude,  blocks[i].y    / METERS_PER_DEGREE_LATITUDE + position.latitude],
        [(blocks[i].x+1) / METERS_PER_DEGREE_LONGITUDE + position.longitude, (blocks[i].y+1) / METERS_PER_DEGREE_LATITUDE + position.latitude],
        [ blocks[i].x    / METERS_PER_DEGREE_LONGITUDE + position.longitude, (blocks[i].y+1) / METERS_PER_DEGREE_LATITUDE + position.latitude],
        [ blocks[i].x    / METERS_PER_DEGREE_LONGITUDE + position.longitude,  blocks[i].y    / METERS_PER_DEGREE_LATITUDE + position.latitude]
      ]]
    }
  }

  if (i) {
    str += ',';
  }

  str += JSON.stringify(feature);

  if (i % 2500 === 0) {
    stream.write(str);
    str = '';
  }

  if (i === 100000) {
    // break;
  }
}

str += ']}';
stream.write(str);

console.log('done');
