
var Transform = module.exports = {};

//var EARTH_RADIUS_M        = 6378137;
//var EARTH_CIRCUMFERENCE_M = EARTH_RADIUS_M * Math.PI * 2;
//var M_PER_DEGREE_LAT      = EARTH_CIRCUMFERENCE_M / 360;

var M_PER_DEGREE_LAT = 6378137 * Math.PI / 180;

Transform.toXY = function(lat, lon) {
  var m_per_degree_lon = M_PER_DEGREE_LAT * Math.cos(lat / 180 * Math.PI);
  return { e: lon * m_per_degree_lon * 2, n: lat * M_PER_DEGREE_LAT };
};

Transform.fromXY = function(x, y) {
  var lat = y / M_PER_DEGREE_LAT;
  var m_per_degree_lon = M_PER_DEGREE_LAT * Math.cos(lat / 180 * Math.PI);
  var lon = x / m_per_degree_lon / 2;
  return { lat:lat, lon:lon };
};
