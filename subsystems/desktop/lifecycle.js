
// Require the core node modules.
var chalk = require( "chalk" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

class DesktopLifeCycle {

	// I initialize the life-cycle controller.
	constructor() {
		// ...
	}


	// ---
	// LIFE-CYCLE METHODS.
	// ---


	// I get called for any error that bubbles up in the Desktop subsystem.
	// --
	// CAUTION: This is only for errors that bubble up in the synchronous portions of the
	// controllers, or those which are explicitly propagated using next(). This will not
	// catch errors that are thrown during the generally-asynchronous flow of control.
	onError( error, request, response ) {

		console.log( chalk.red.bold( "Desktop Error Handler:" ) );
		console.log( error );

		// If the headers have already been sent, it's too late to adjust the output, so
		// just end the response so it doesn't hang.
		if ( response.headersSent ) {

			return( response.end() );

		}

		// Render the fatal error page.
		response.rc.title = "Server Error";
		response.rc.description = "An unexpected error occurred. Our team is looking into it.";
		response.status( 500 );
		response.setView( "common:error.fatal" );

	}

}

exports.DesktopLifeCycle = DesktopLifeCycle;
