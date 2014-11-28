// Timbit

// load the timbits module
var timbits = require( 'timbits' );

var util = require( 'util' );

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

// xml2js - used because microsoft still loves xml, but we would rather work in json :)
var xml2js = require("xml2js");
var parser = new xml2js.Parser({explicitArray : false}); // prevents single element arrays in json
var parseString = parser.parseString;


//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.about = 'Information Middleman for Cyth Application - Private, requires auth to actually use, though this help page is free.';

timbit.params = {
	debug: {
		description: 'Flag, when set will not write, but instead displays content in specified index',
		required: false,
		strict: false,
		values: ['true', 'yes']
	},
	index: {
		description: 'Index to access in memcache backend',
		required: true,
		default: 'stored',
		strict: false,
		values: [ 'random', 'nottelling' ]
	},
	key: {
		description: 'Authentication key, if you do not have this, the app will not work except when testing end point.',
		required: true,
		default: 'testing',
		strict: false,
		values: [ 'testing' ]
	}
};

timbit.examples = [
	{
		href: '/broker/?index=random&key=testing',
		caption: 'Retrieve data from key named random'
	}
];

timbit.eat = function( req, res, context ) {
	// Must be a POST request, unless testing if endpoint is alive, or debug to read contents
	if ( 'POST' != req.method && 'testing' != context.key && undefined == context.debug ) {
		res.send( 405, "Method Not Allowed" );
		return;
	}
	
	// default value, could have also been supplied.
	if ( context.key == 'testing' ) {
		context.lastWritten = new Date();
		context.data = 'Test succeeded, note no writing or reading occurs, this just checks the service is responding without authentication';
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
		if ( context.key !== authkey ) {
			res.send( 401, "Unauthorized" );
			return;	
		}
	
		// authenticated, proceeding with read/write
		if ( undefined == context.debug ) {
			var now = new Date();
			var xml = "<root>" + body + "</root>";
			var jsondata = parseString( xml, function ( err, result ) {
				var stored = {
					lastWritten: now,
					data: result
				};
				var storedJSON = JSON.stringify( stored );

				client.set( context.index, storedJSON, function( err, val ) {
					context.lastWritten = stored.lastWritten;
					context.data = stored.data;
					timbit.render(req, res, context);
				} );
			});
		}
		else {
			// debug, show contents instead of writing
			client.get( context.index, function( err, val ) {
				var result = JSON.parse( val );
				context.lastWritten = ( null == result ) ? '' : result.lastWritten;
				context.data = ( null == result ) ? '' : JSON.stringify( result.data );
				timbit.render( req, res, context );
			} );
		}
	} );

};