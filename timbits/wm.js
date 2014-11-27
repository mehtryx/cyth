// Timbit

// load the timbits module
var timbits = require('timbits');

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.about = 'Cyth data retrieval for wild metrix counter data, used as middleman between WM and Cyth.';

timbit.params = {
	index: {
		description: 'Index to access in memcache backend',
		required: true,
		default: 'wm',
		strict: false,
		values: [ 'wm', 'stored', 'messages' ]
	},
	servername: {
		description: 'servername to return (multiples allowed)',
		required: false,
		strict: false,
		values: [ 'wpgccweb01', 'wpgccweb01,wpgpdweb84' ]
	},
	counter: {
		description: 'counter to display (multiples allowed)',
		required: false,
		strict: false,
		values: [ 'Requests/Sec', 'Requests/Sec,% Processor Time']
	},
	columns: {
		description: 'specify columns in output, otherwise assumes (servername, counter, counter, ...) ',
		required: false,
		strict: false
	},
	key: {
		description: 'Authentication key, if you do not have this, the app will not work.',
		required: true,
		strict: false
	},
	color: {
		description: "Color parameter for output to cythe, comma seperated list in order of counters deing displayed using hexidecimal in format #RRGGBB ",
		required: false,
		strict: false,
		values: [ '#52ff7f,#ff7e0e,#9d8cf9' ]
	},
	type: {
		description: 'Type used to plot data on cyth chart, ie: line, area in a comma seperated list that matches the order of column output',
		required: false,
		strict: false,
		values: [ 'line,area,line' ]
	}
};

timbit.examples = [
	{
		href: '/wm/?key=testing',
		caption: 'Return data, all rows in default column order'
	}
];

timbit.eat = function(req, res, context) {
	var authkey = process.env.AUTHKEY;
	if ( context.key !== authkey ) {
		res.send( 400, "Unauthorized access" );
		return;	
	}

};