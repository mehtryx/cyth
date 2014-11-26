// Timbit

// load the timbits module
var timbits = require( 'timbits' );

var util = require( 'util' );

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

// xml2js - used because microsoft still loves xml, but we would rather work in json :)
var parseString = require("xml2js").parseString;


//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.about = 'Information Middleman for Cyth Application - Private, requires auth to actually use, though this help page is free.';

timbit.params = {
	write: {
		description: 'Flag indicating this is a write',
		required: false,
		strict: false,
		values: ['true', 'yes']
	},
	key: {
		description: 'key to access in memcache backend',
		required: true,
		default: 'stored',
		strict: false,
		values: [ 'random', 'nottelling' ]
	},
	item: {
		description: 'Items to return, comma seperated list ie: (servername,memory), you can also filter by specifying the value for each column ie: (servername|wpgccweb01,memory)',
		required: false,
		strict: false,
		values: [ 'servername,memory', 'servername|wpgccweb01,memory' ]
	},
	auth: {
		description: 'Authentication key, if you do not have this, the app will not work.',
		required: true,
		default: 'testing',
		strict: false,
		values: [ 'testing' ]
	},
	color: {
		description: "Color parameter for output to cythe, comma seperated list in order of items deing displayed using hexidecimal in format #RRGGBB ",
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
		href: '/broker/?key=random&auth=testing',
		caption: 'Retrieve data from key named random'
	}
];

timbit.eat = function( req, res, context ) {
	// default value, could have also been supplied.
	if ( context.auth == 'testing' ) {
		context.lastWritten = new Date();
		context.data = 'Test succeeded, note no writing or reading occurs, this just checks the service is responding';
		timbit.render( req, res, context );
		return;
	}
	var body = '';
	req.on( 'data', function( data ) {
		body += data;
	} );
	
	req.on( 'end', function () {
		
		// auth key is an alpha numeric value, case sensitive up to 64 characters
		var authkey = process.env.AUTHKEY;
		if ( context.auth !== authkey ) {
			res.send( 400, "Unauthorized access" );
			return;	
		}
	
		// authenticated, proceeding with read/write
		if ( undefined != req.query.write ) {
			var now = new Date();
			var xml = "<root>" + body + "</root>";
			var jsondata = parseString( xml, function ( err, result ) {
				var stored = {
					lastWritten: now,
					data: result
				};
				var storedJSON = JSON.stringify( stored );

				client.set( context.key, storedJSON, function( err, val ) {
					context.lastWritten = stored.lastWritten;
					context.data = stored.data;
					timbit.render(req, res, context);
				} );
				
			});//JSON.stringify( util.inspect( req, { showHidden: true, depth: 1 } ) );
			
		}
		else {
			// reading by default
			client.get( context.key, function( err, val ) {
				var result = JSON.parse( val );
				context.lastWritten = ( null == result ) ? '' : result.lastWritten;
				context.data = ( null == result ) ? '' : JSON.stringify( result.data );
				timbit.render( req, res, context );
			} );
		}
	} );

};