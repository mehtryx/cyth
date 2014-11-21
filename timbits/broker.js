// Timbit

// load the timbits module
var timbits = require( 'timbits' );

var util = require( 'util' );

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

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
		description: 'Index of item in stored data to return, i.e. name or position in list',
		required: false,
		strict: false,
		values: [ 'wpgccweb01', '10' ]
	},
	auth: {
		description: 'Authentication key, if you do not have this, the app will not work.',
		required: true,
		default: 'testing',
		strict: false,
		values: [ 'testing' ]
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
	
	// auth key is an alpha numeric value, case sensitive up to 64 characters
	var authkey = process.env.AUTHKEY;
	if ( context.auth !== authkey ) {
		res.send( 400, "Unauthorized access" );
		return;	
	}
	
	// authenticated, proceeding with read/write
	if ( undefined != req.query.write ) {
		var now = new Date();
		var jsondata = JSON.stringify( util.inspect( req, { showHidden: true, depth: null } ) );
		var stored = {
			lastWritten: now,
			data: jsondata
		};
		var storedJSON = JSON.stringify( stored );

		client.set( context.key, storedJSON, function( err, val ) {
			context.lastWritten = stored.lastWritten;
			context.data = stored.data;
			timbit.render(req, res, context);
		} );
	}
	else {
		// reading by default
		client.get( context.key, function( err, val ) {
			var result = JSON.parse( val );
			context.lastWritten = ( null == result ) ? '' : result.lastWritten;
			context.data = ( null == result ) ? '' : result.data;
			timbit.render( req, res, context );
		} );
	}

};