// Timbit

// load the timbits module
var timbits = require('timbits');

//create and export the timbit
var timbit = module.exports = new timbits.Timbit();
var util = require('util');
// additional timbit implementation code follows...

/*
timbit.about = 'a description about this timbit';

timbit.examples = [
  {
    href: '/timbit/?q=winning',
    caption: 'Default View'
  }, {
    href: '/timbit/alternate?q=winning',
    caption: 'Alternate View'
  }
];

timbit.params = {
  q: {
    description: 'Keyword to search for',
    required: true,
    strict: false,
    values: ['Coffee', 'Timbits']
  }
};
*/

timbit.eat = function(req, res, context) {
	var query = req.originalUrl;
	console.log( 'request ' + query );
	context.request = util.inspect( req.body, { showHidden: false, depth: 3 } );
	timbit.render( req, res, context );
};