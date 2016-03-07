
// TODO: this should respect latitude
var EARTH_RADIUS_IN_METERS = 6378137;
var EARTH_CIRCUMFERENCE_IN_METERS = EARTH_RADIUS_IN_METERS * Math.PI * 2;

//*****************************************************************

function geoToMeters(lat, lon) {
  var
    latitude = Math.min(1, Math.max(0, 0.5 - (Math.log(Math.tan(Math.PI/4 + Math.PI/2 * lat / 180)) / Math.PI) / 2)),
    longitude = lon/360 + 0.5;
  return {
    x: longitude*EARTH_CIRCUMFERENCE_IN_METERS,
    y: latitude *EARTH_CIRCUMFERENCE_IN_METERS
  };
}

//adapted from http://alienryderflex.com/polygon
function calcSortedIntersections(lines, y) {
  var res = [];
  var A, B, x;
  for (var i = 0; i < lines.length; i++) {
    A = lines[i].start;
    B = lines[i].end;
    if (A.y < y && B.y >= y || B.y < y && A.y >= y) {
      x = A.x + (y-A.y) / (B.y-A.y) * (B.x-A.x);
      res.push(x);
    }
  }
  return res.sort(function(a, b) {
    return a > b;
  });
}

function rasterize(polygon) {
  var pixels = [];
  var lines = [];
  var bounds = { y:Number.MAX_VALUE, Y:Number.MIN_VALUE };

  for (var i = 0; i < polygon.length-1; i++) {
    // {x,y}
    lines.push({ start:polygon[i], end:polygon[i+1] });

    // assumes first == last
    bounds.y = Math.min(bounds.y, polygon[i].y) <<0;
    bounds.Y = Math.max(bounds.Y, polygon[i].y) <<0;
  }

  var inters, start, end;

  for (var j = bounds.Y-1; j >= bounds.y; j--) {
    inters = calcSortedIntersections(lines, j);
    // fill between each pair of intersections
    for (var i = 0; i < inters.length; i += 2) {
      start = inters[i]   <<0;
      end   = inters[i+1] <<0;
      for (var ii = start; ii <= end; ii++) {
        pixels.push({ x:ii, y:j });
      }
    }
  }
  return pixels;
}

function getOriginMeters(geojson) {
  // get bbox
  var maxLat = -90;
  var minLon = 180;

  for (var i = 0; i < geojson.features.length; i++) {
    var feature = geojson.features[i];
    for (var j = 0; j < feature.geometry.coordinates[0].length; j++) {
      var coordinate = feature.geometry.coordinates[0][j];
      maxLat = Math.max(maxLat, coordinate[1]);
      minLon = Math.min(minLon, coordinate[0]);
    }
  }

  return geoToMeters(maxLat, minLon);
}

//*****************************************************************

module.exports = function(geojson, greedyZ) {

  var blocks = [];

// for (var x = 0; x < 3; x++) { // 1.5km
// for (var y = 0; y < 11; y++) { // 5.5km

// for (var i = 0; i < 512; i++) {
//   for (var j = 0; j < 512; j++) {
//     for (var k = 0; k < 256; k++) {
//       bloks.push({ x:x*255 + i, y:y*255 + j, z:k });
//     }
//   }
// }

// }
// }

  var origin = getOriginMeters(geojson);

  for (var i = 0; i < geojson.features.length; i++) {
    var feature = geojson.features[i];
    var minHeight = feature.properties.minHeight || 0;
    var height    = feature.properties.height    || 3;

    var z0 = Math.max(0, minHeight);
    var z1 = Math.min(256, height);

    var polygon = [];
    for (var j = 0; j < feature.geometry.coordinates[0].length; j++) {
      var coordinate = feature.geometry.coordinates[0][j];
      var position = geoToMeters(coordinate[1], coordinate[0]);
      polygon.push({ x:position.x-origin.x, y:position.y-origin.y });
    }

    var pixels = rasterize(polygon);
    for (var p = 0; p < pixels.length; p++) {
      if (greedyZ) {
        blocks.push({ x:pixels[p].x, y:pixels[p].y, z0:z0, z1:z1 });
      } else {
        for (var z = z0; z < z1; z++) {
          blocks.push({ x:pixels[p].x, y:pixels[p].y, z:z });
        }
      }
    }
  }

  return blocks;
};
