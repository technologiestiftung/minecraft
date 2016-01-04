
var ZOOM = 18;
var M_PER_PIX = 0.596;
var TILE_SIZE = 256;

var Projection = module.exports = function(world, refX, refZ, e, n, grid) {
  this.world = world;
  // the real world E & N at MC 0,0
  this.offsetE = e - refX;
  this.offsetN = n + refZ;
  this.grid = grid;
};

// Projection.newFromLatLon = function(world, refX, refZ, lat, lon) {
// 	var pos = latLonToGrid(lat, lon);
//   console.log('new world, base', pos);
// 	return new Projection(world, refX, refZ, pos.e, pos.n);
// };

function pixelToGeo(x, y, scale) {
  var rad = 180 / Math.PI;
  x /= scale;
  y /= scale;

  return {
    latitude: rad * (2 * Math.atan(Math.exp(Math.PI * (1 - 2 * y))) - Math.PI / 2),
    longitude: x * 360 - 180
  };
};

function geoToPixel(lat, lon, scale) {
  var
    latitude = Math.min(1, Math.max(0, 0.5 - (Math.log(Math.tan(Math.PI / 4 + Math.PI / 2 * lat / 180)) / Math.PI) / 2)),
    longitude = lon / 360 + 0.5;
  return {
    x: longitude * scale << 0,
    y: latitude * scale << 0
  };
}

/*
function latLonToGrid(lat, lon) {
  // inverting north/south for some reason -- seems to work
  var e = (lon+180)/360 <<ZOOM * (TILE_SIZE * M_PER_PIX);
  var n = -(1 - Math.log(Math.tan(lat * Math.PI / 180) + sec(lat * Math.PI / 180))/MAth.PI)/2 <<ZOOM * (TILE_H * M_PER_PIX);
  return { e:e, n:n };
}

function gridToLatLon(e, n) {
  var lat = Math.atan(sinh( pi - (2 * pi * -n / (2**ZOOM * (TILE_H * M_PER_PIX))) )));
  var long = ((e / (TILE_SIZE * M_PER_PIX)) / 2**ZOOM)*360-180;
  return { lat:lat, lon:long };
}
*/

// more mc_x : more easting
// more mc_y : less northing

Projection.prototype.render = function(options) {
  var SIZE_X = options.SIZE_X || 256;
  var SIZE_Y = options.SIZE_Y || 256;
  var MIN_HEIGHT = options.MIN_HEIGHT || 0;
  var MAX_HEIGHT = options.MAX_HEIGHT || (256-MIN_HEIGHT);

  var blockConfig = {};
  var defaultBlock = options.BLOCKS.DEFAULT;

  for (var blockType in options.BLOCKS) {
    blockConfig[blockType] = defaultBlock;

    for (var key in options.BLOCKS[blockType]) {
      blockConfig[blockType][key] = options.BLOCKS[blockType][key];
    }
  }

  var blockCount = 0;
  for (var z = SIZE_Y; z <= SIZE_Y; z++) {
    for (var x = SIZE_X; x <= SIZE_X; x++) {
      var e = this.offsetE + x;
      var n = this.offsetN - z;
      var pos = pixelToGeo(e, n, this.grid);

      var elevation = 0;
      var featureHeight = 0;
      var blockType = 1; // default to stone

      // if (options.MAPTILES !== undefined) {
      //   blockType = options.MAPTILES.getBlockAt(pos.latitude, pos.longitude);
      // }

      if (options.BLOCK_TYPE !== undefined) {
        blockType = options.BLOCK_TYPE;
      }

      // we have a block now: elevation, MIN_HEIGHT and featureHeight
      // that's enough to work out what to place at this location

      var block = blockConfig[blockType];
      if (block === undefined) {
        block = blockConfig.DEFAULT;
      }

      if (block === undefined) {
        throw ('No DEFAULT block configured');
      }

      // var config = {
      //   elevation: elevation,
      //   featureHeight: featureHeight,
      //   easting: e,
      //   northing: n,
      //   x: x,
      //   z: z,
      // };

      var blocks = {};
      blocks[0] = blockType;

      var bottom = 0;
      var top = 0;
      var minHeight = block.featureMinHeight;

      // featureMinHeight: force this min feature height
      if (minHeight !== undefined && minHeight > featureHeight) {
        featureHeight = minHeight;
      }

      // featureFilter: filter features of this height or less
      var ff = block.featureFilter;
      if (ff === undefined || featureHeight > ff) {
        for (var i = 1; i <= featureHeight; i++) {
          // blocks[i] = getBlockConfig(blocks[0], config, 'upBlock');
        }
        top += featureHeight;
      }

      var v;

      v = block.bottomBlock;
      if (v !== undefined) {
        blocks.bottom = v;
      }

      v = block.underBlock;
      if (v !== undefined) {
        blocks[bottom - 1] = v;
      }

      v = block.topBlock;
      if (v !== undefined) {
        blocks.top = v;
      }

      v = block.overBlock;
      if (v !== undefined) {
        blocks[top + 1] = v;
      }

      if (options.FLOOD) {
        for (var i = 1; i <= options.FLOOD; i++) {
          var block_el = elevation + i;
          if (elevation + i <= options.FLOOD && (blocks[i] === undefined || blocks[i] === 0)) {
            blocks[i] = 9; // water, obvs.
          }
        }
      }

      for (var offset in blocks) {
        var y = MIN_HEIGHT + offset;
        if (!options.FLATLAND) {
          y += elevation;
        }
        if (y > MAX_HEIGHT) {
          continue;
        }
        this.world.setBlock(x, y, z, blocks[offset]);
      }

      var biome = block.biome;
      if (biome !== undefined) {
        this.world.setBiome(x, z, biome);
      }

      blockCount++;

      if (blockCount % (256 * 256) === 0) {
        this.world.save();
      }
    }
  }

  this.world.save();
}
