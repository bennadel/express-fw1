
module.exports = function deepClone( target ) {

	return( JSON.parse( JSON.stringify( target ) ) );

};
