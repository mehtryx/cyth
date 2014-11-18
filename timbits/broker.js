// Timbit

// load the timbits module
var timbits = require('timbits');

// memcache
var memjs = require('memjs');
var client = memjs.Client.create();

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();

timbit.eat = function(req, res, context) {
	console.log( JSON.stringify(req.query) );

	if ( req.query.write != undefined ) {
		var now = new Date();
		var jsondata = JSON.stringify( req.body );
		var stored = {
			lastWritten: now,
			data: jsondata
		}
		client.set( 'stored', stored, function(err, val) {
			context.lastWritten = val.lastWritten;
			context.data = val.stored;
			
			timbit.render(req, res, context);
		});
	}
	else {
		// reading by default
		client.get( 'stored', function( err, val ) {
			context.lastWritten = val.lastWritten;
			context.data = val.data;

			timbit.render(req,res,context);
		} );
	}

};