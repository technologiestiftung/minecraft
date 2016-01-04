
var config = module.exports = {

	DEFAULT: {
		// block undefined by default
		// downBlock undefined by default
		upBlock:35.07, // dark grey wool
		featureFilter: 2,
		featureMinHeight: 0,
		// bottomBlock undefined by default
		// underBlock undefined by default
		// topBlock undefined by default
		// overBlock undefined by default
	},
	'3.1':{ // course dirt
		upBlock: '18', // leaves
		featureFilter: 0, // show low features
	},
	'3':{ // dirt
		upBlock: '18', // leaves
		featureFilter: 0, // show low features
	},
	'2':{ // grass
		upBlock: '18', // leaves
		featureFilter: 0, // show low features
		downBlock: 3, // dirt
	},
	'45':{ // brick
		featureMinHeight: 3, // buildings always at least 3m high
		upBlock: 45,
		overBlock: 171.08, // light grey carpet
	},
	'98':{ // stone blocks
		upBlock: 98,
		featureMinHeight: 3, // buildings always at least 3m high
	},
	'8':{ // water
		featureFilter: 10, // remove small features on water (boats)
		upBlock: 1, // make big features stone (large boats & bridges)
		underBlock: 3, // base under the water.
	},
	'9':{ // water
		featureFilter: 10, // remove small features on water (boats)
		upBlock: 1, // make big features stone (large boats & bridges)
		underBlock: 3, // base under the water.
	},
	'10':{ // lava
		featureFilter: 10, // remove small features on lava (boats)
		upBlock: 1, // make big features stone (large boats & bridges)
		underBlock: 1, // base under the lava.
	},
	'11':{ // lava
		featureFilter: 10, // remove small features on lava (boats)
		upBlock: 1, // make big features stone (large boats & bridges)
		underBlock: 1, // base under the lava.
	},
	'12':{ // sand
		upBlock: 5, // wood features on sand??
		underBlock: 3, // base under the sand.
	},
	'12.01':{ // red sand
		underBlock: 3, // base under the sand.
	},
	'13':{ // gravel
		underBlock: 3, // base under the gravel.
	},
};
