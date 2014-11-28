// Timbit

// load the timbits module
var timbits = require('timbits');

// memcache
var memjs = require( 'memjs' );
var client = memjs.Client.create();

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.about = 'Cyth data retrieval for messages, used as middleman between Integration and Cyth.';

timbit.params = {
	index: {
		description: 'Index to access in memcache backend',
		required: true,
		default: 'messages',
		strict: false,
		values: [ 'wm', 'stored', 'messages' ]
	},
	tag: {
		description: 'tag to return',
		required: false,
		strict: false,
		values: [ 'wpgccweb01', 'wpgccweb01,wpgpdweb84' ]
	},
	key: {
		description: 'Authentication key, if you do not have this, the app will not work.',
		required: true,
		strict: false
	}
};

timbit.examples = [
	{
		href: '/messages/?key=testing',
		caption: 'Return data, all rows in default column order'
	}
];

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
	
	client.get( context.index, function( err, val ) {
		var result = JSON.parse( val );
		context.now = new Date();
		context.lastWritten = ( null == result ) ? '' : result.lastWritten;
		var alerts = [];
		var info = [];
		for ( var row in result.data.root.row ) {
			var msg = result.data.root.row[row]
			if ( 'alerts' == msg.tag ) {
				alerts.push( { 'message': msg.message } );
				console.log( msg.message );
			}
			else {
				info.push( { 'message': msg.message } );
				console.log( msg.message );
			}
		}
		
		
		context.alerts = Object.keys(alerts).length ? { 'msgs': alerts } : null;
		context.info = Object.keys(info).length ? { 'msgs': info } : null;
		timbit.render( req, res, context );
	} );

};