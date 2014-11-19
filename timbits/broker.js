// Timbit

// load the timbits module
var timbits = require('timbits');

var util = require('util');

// memcache
var memjs = require('memjs');
var client = memjs.Client.create();

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.eat = function(req, res, context) {
	console.log( JSON.stringify(req.query) );

	if ( req.query.write != undefined ) {
		var now = new Date();
		var jsondata = JSON.stringify( util.inspect( req.body, { showHidden: true, depth: null } ) );
		var stored = {
			lastWritten: now,
			data: jsondata
		};
		var storedJSON = JSON.stringify( stored );
		client.set( 'stored', storedJSON, function(err, val) {
			context.lastWritten = val.lastWritten;
			context.data = val.stored;
			context.val = util.inspect( val );
			context.stored = util.inspect( stored, { showHidden: true, depth: null } );
			timbit.render(req, res, context);
		});
	}
	else {
		// reading by default
		client.get( 'stored', function( err, val ) {
			var result = JSON.parse( val );
			context.lastWritten = result.lastWritten;
			context.data = result.data;


			timbit.render(req,res,context);
		} );
	}

};