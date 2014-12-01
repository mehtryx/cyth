// Timbit

// load the timbits module
var timbits = require('timbits');

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

// needed to parse json data
var _ = require( 'underscore' );

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.about = 'Cyth data retrieval for wild metrix counter data, displays CPU and Requests/sec on single gauge.';

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
		required: true,
		strict: false,
		values: [ 'wpgccweb01', 'wpgccweb01,wpgpdweb84' ]
	},
	key: {
		description: 'Authentication key, if you do not have this, the app will not work.',
		required: true,
		strict: false
	},
	color: {
		description: "Override color parameter for output to cythe, displayed using hexidecimal in format #RRGGBB ",
		required: false,
		strict: false,
		values: [ '#52ff7f','#ff7e0e','#9d8cf9' ]
	},
	thresholds: {
		description: 'Set values for color changes, by default this occurs at 40 and 80.  Default colors are green until 40, yellow until 80 and red after.',
		required: false,
		strict: false,
		values: [ '70,90' ]
	}
};

timbit.examples = [
	{
		href: '/cpureq/?key=abc1234&servername=wpgpdweb83',
		caption: 'returns data for wpgpdweb83 assuming key is valid'
	}
];

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

timbit.eat = function(req, res, context) {
	// Must be a GET request,
	if ( 'GET' != req.method ) {
		res.send( 405, "Method Not Allowed" );
		return;
	}
	
	// Must authenticate
	var authkey = process.env.AUTHKEY;
	if ( context.key !== authkey ) {
		res.send( 401, "Unauthorized" );
		return;	
	}
	
	// retrieve data
	client.get( context.index, function( err, val ) {
		// if we get an error from the memcaches server
		if ( err ) {
			res.send( 502, "Bad Gateway" );
			return;	
		}
		
		var result = JSON.parse( val );
		var server;
		var serverData;
		
		// get row data specific to specified serverName
		try {
			server = context.servername.toUpperCase();
			serverData = _.where( result.data.root.row, { 'ServerName': server } );
		}
		catch ( err ) {
			// error occured, possibly invalid json, send error to log and return http 500
			console.log( 'ERROR - parsing data for ' + context.serverName + ': ' + err );
			res.send( 500, 'Internal Server Error' );
			return;
		}
		
		// calculate data values
		var cpu;
		var requests;
		var total;
		
		// the assumption here is that the source data will only have one row per counter type for the server
		for( var row in serverData ) {
			if ( serverData[row].counter.toLowerCase() == '% processor time' ) {
				cpu = serverData[row].value;
			}
			else if ( serverData[row].counter.toLowerCase() == 'requests/sec' ) {
				requests = serverData[row].value;
			}
		}
		
		// check if we have both data values
		if ( undefined == cpu || undefined == req ) {
			// we will send an empty data field, causing the widgit to be blank.
			context.data = '';
		}
		else {
			total = requests * 100 / cpu;  // essentially making the req/total = to the same percentage as cpu utilization
			context.data = requests + ',' + total;
		}
		
		// check transitions (only 2), the following are the defauls of 40/80
		var yellow = 40; // default threshold for yellow
		var red = 80; // default threshold for red
		if ( undefined !=context.thresholds ) {
			var thresholds = context.thresholds.split( ',' );
			// make sure only 2 were given
			if ( Object.keys( thresholds ).length != 2 ) {
				res.send( 400, 'Bad Request' );
				console.log( 'Invalid threshold size, must be two' );
				return;
			}

			// make sure second is larger than first, and they are between 0 and 100
			if ( parseInt( thresholds[1] ) <= parseInt( thresholds[0] ) || parseInt( thresholds[0] ) < 0 || parseInt( thresholds[1] ) > 100 ) {
				res.send( 400, 'Bad Request' );
				console.log( 'Invalid threshold values, please make second number larger than first, and be a value from 0 to 100' );
				return;
			}
			
			yellow = thresholds[0];
			red = thresholds[1];
		}
		
		// colors per threshold by default
		var defaultColor = '#00C800';
		var yellowColor = '#FFFF00';
		var redColor = '#C80000';
		
		var chosenColor = '';
		var colors;
		var numColors=3;
		
		// before we start comparisons for color, lets convert spu to an int to ensure compare is correct
		cpu = parseInt( cpu );
		// check for color and for color overrides
		if ( undefined != context.color ) {
			// it is possible we got multiple values, not knowing the threshold. parse array
			colors = context.color.split( ',' );
			numColors = Object.keys( colors ).length;
		}
		else {
			colors = [ defaultColor, yellowColor, redColor ];
		}
		
		// make sure we do not have more colors than allowed ( max is three, initial color + two thresholds)
		if ( numColors > 3 ) {
			res.send( 400, 'Bad Request' );
			console.log( 'Invalid number of colors, only three allowed maximum' );
			return;
		}
		
		// if we have three colors specified, and value is below yellow threshold
		if ( 3 == numColors ) {
			if ( cpu < yellow ) {
				chosenColor = colors[0];
			}
			else if ( cpu < red ) {
				chosenColor = colors[1];
			}
			else {
				chosenColor = colors[2];
			}
		}
		else if ( 2 == numColors ) { // only thresholds were specified, check what matches
			if ( cpu < yellow ) {
				chosenColor = defaultColor;
			}
			else if ( cpu < red ) {
				chosenColor = colors[0]; // first threshold color
			}
			else {
				chosenColor = colors[1]; // second threshold color
			}
		}
		else { // only one color sent, must be meant to override color choice
			chosenColor = colors[0];
		}
		
		// construct data
		context.header = 'Requests/Sec,total'; // Only the first heading shows on graph, but second needed to indicate second data
		// context.data was specified above when calculating total
		context.widgetType = 'Type,gauge'; // the type of wigit on cyth
		context.color = 'Color,' + chosenColor;
		context.labelShow = 'LabelShow,0'; //prevents numbers from showing under gauge
		res.setHeader("Content-Type", "text/plain");
		timbit.render( req, res, context );
	} );
};