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
	debug: {
		description: 'Flag indicating this is a write',
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
		description: 'Authentication key, if you do not have this, the app will not work.',
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
			res.send( 400, "Unauthorized access" );
			return;	
		}
	
		// authenticated, proceeding with read/write
		if ( undefined == req.query.debug ) {
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