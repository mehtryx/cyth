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
		description: 'specify columns in output, otherwise assumes (datetime, counter, counter...) ',
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
		required: true,
		strict: false,
		values: [ '#52ff7f,#ff7e0e,#9d8cf9' ]
	},
	type: {
		description: 'Type used to plot data on cyth chart, ie: line, area in a comma seperated list that matches the order of column output',
		required: true,
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
		var result = JSON.parse( val );
		context.now = new Date();
		context.lastWritten = ( null == result ) ? '' : result.lastWritten;
		var header = [];
		var rows = [];
		var servers = [];
		
		if ( undefined != context.servername ) {
			context.servername = context.servername.toUpperCase();
			servers = context.servername.split( ',' );
			
		}
		
		if ( undefined != context.columns ) {
			var tmpheader = context.columns.split( ',' );
			// correct case if incorrect
			tmpheader.forEach( function ( item ) { 
				header.push( toTitleCase( item ) );
			})
		}
		else {
			// figure out how many columns we have here...(i.e. number of unique counters)
			header.push( toTitleCase( context.counter ) );
		}
		
		var server = _.where( result.data.root.row, { 'ServerName': servers[0] } ); // only processing one server for now
		
		var heading = ( 'gauge' == context.type.toLowerCase() ) ? '' : 'DateTime';
		for( var iHead=0, iLen=Object.keys(header).length; iHead<iLen; iHead++ ) {
			heading += ( ( 'gauge' == context.type.toLowerCase() ) ? '' : ',' ) + header[iHead];
		}
		
		
		heading += ( ( 'gauge' == context.type.toLowerCase() ) ? ',total' : ',' );
		context.heading=heading;
		var data = [];
		for( var row in server ) {
			if ( server[row].counter.toLowerCase() == context.counter.toLowerCase() ) {
				if ( 'gauge' == context.type.toLowerCase() ) {
					data.push( server[row].value + ',100' );
				}
				else {
					data.push( server[row].datetime + ',' + server[row].value );
				}
			}
		}
		context.data = [ '90, 100' ]; //data;
		context.color = 'Color,' + context.color;
		context.type = 'Type,' + context.type;
		context.showlabel = 'LabelShow,0';
		res.setHeader("Content-Type", "text/plain");
		timbit.render( req, res, context );
	} );
};