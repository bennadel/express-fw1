
// Require the core node modules.
var chalk = require( "chalk" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

class SubsystemsLifeCycle {

	// I initialize the life-cycle controller.
	constructor( userService ) {

		this._userService = userService;

	}


	// ---
	// LIFE-CYCLE METHODS.
	// ---


	// I get called before every single request to the application.
	onBefore( request, response, next ) {

		// Setup the default user object for the request. This will determine the current
		// user's authentication status in the application.
		request.rc.user = {
			id: 0,
			username: "",
			isAuthenticated: false
		};

		// If there's no session cookie, there's no user to validate yet. Move onto the
		// next controller.
		if ( ! request.cookies.sessionId ) {

			return( next() );

		}

		// If we made it this far, the use has a session cookie; but, we need to validate
		// that it's actually valid for a user.
		// --
		// CAUTION: For simplicity, this session is blindly using the given user ID as 
		// the source of truth. In reality, you would need MUCH MORE SECURE sessions.
		this._userService
			.getUser( +request.cookies.sessionId )
			.then(
				( user ) => {

					request.rc.user = {
						id: user.id,
						username: user.username,
						isAuthenticated: true
					};

				},
				( error ) => {

					// Ignore any not-found error, let the default user fall-through.
					// But, expire the session since the cookie clearly is not valid.
					response.cookie( "sessionId", "", { expires: new Date( 0 ) } );

				}
			)
			.then( next )
			.catch( next )
		;

	}


	// I get called for any error that bubbles up from one of the subsystems.
	// --
	// CAUTION: This is only for errors that bubble up in the synchronous portions of the
	// controllers, or those which are explicitly propagated using next(). This will not
	// catch errors that are thrown during the generally-asynchronous flow of control.
	onError( error, request, response ) {

		console.log( chalk.red.bold( "Global Error Handler:" ) );
		console.log( error );

		// If the headers have already been sent, it's too late to adjust the output, so
		// just end the response so it doesn't hang.
		if ( response.headersSent ) {

			return( response.end() );

		}

		// Render the not found error page.
		if ( error.message === "Not Found" ) {

			response.status( 404 );
			response.setView( "common:error.notfound" );

		} else {

			// Render the fatal error page.
			response.rc.title = "Server Error";
			response.rc.description = "An unexpected error occurred. Our team is looking into it.";
			response.status( 500 );
			response.setView( "common:error.fatal" );

		}
		
	}

}

exports.SubsystemsLifeCycle = SubsystemsLifeCycle;
