
// Require the core node modules.
var chalk = require( "chalk" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

class ApiLifeCycle {

	// I initialize the life-cycle controller.
	constructor() {
		// ...
	}


	// ---
	// LIFE-CYCLE METHODS.
	// ---


	// I get called before every single request to this subsystem.
	onBefore( request, response ) {

		// All requests to this subsystem must be made by authenticated users. If the
		// user is not authenticating, reject the request.
		if ( ! request.rc.user.isAuthenticated ) {

			throw( new Error( "Unauthorized" ) );

		}

		// All controllers are intended to overwrite this property, which will be 
		// returned back to the client.
		response.rc.data = true;

	}


	// I get called after every single request to this subsystem.
	onAfter( request, response ) {

		// Return the API response to the client.
		response.json({
			ok: true,
			data: response.rc.data
		});

	}


	// I get called for any error that bubbles up in the API subsystem.
	// --
	// CAUTION: This is only for errors that bubble up in the synchronous portions of the
	// controllers, or those which are explicitly propagated using next(). This will not
	// catch errors that are thrown during the generally-asynchronous flow of control.
	onError( error, request, response ) {

		console.log( chalk.red.bold( "API Error Handler:" ) );
		console.log( error );

		// If the headers have already been sent, it's too late to adjust the output, so
		// just end the response so it doesn't hang.
		if ( response.headersSent ) {

			return( response.end() );

		}

		// Since all API calls are intending to return JSON, let's render the error 
		// as such.
		// --
		// NOTE: For the demo, I am keeping this error handling fairly naive.
		response
			.status( this._getStatusCode( error ) )
			.json({
				ok: false,
				data: "Something went wrong."
			})
		;

	}


	// ---
	// PRIVATE METHODS.
	// ---


	// I try to reduce the given error into a meaningful HTTP status code.
	_getStatusCode( error ) {

		switch ( error.message.toLowerCase() ) {
			case "unauthorized":
				return( 401 );
			break;
			case "not found":
				return( 404 );
			break;
			case "invalid argument":
				return( 400 );
			break;
			default:
				return( 500 );
			break;
		}

	}

}

exports.ApiLifeCycle = ApiLifeCycle;
