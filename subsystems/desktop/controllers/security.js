
class SecurityController {

	// I initialize the controller.
	constructor( userService ) {

		this._userService = userService;

	}

	
	// ---
	// LIFE-CYCLE METHODS.
	// ---


	// I get called before every single request to this controller.
	onBefore( request, response ) {

		// Since most of the interfaces in this controller render a form, we can param
		// the common form rendering values.
		response.rc.errorMessage = null;

	}


	// ---
	// PUBLIC METHODS.
	// ---


	// I render the login form.
	login( request, response ) {

		response.rc.title = "Login";

	}


	// I process the login form.
	processLogin( request, response, next ) {

		// The processing action shares the same view as the form.
		response.rc.title = "Login";
		response.setView( ".login" );

		if ( ! request.rc.username ) {

			response.status( 400 );
			response.rc.errorMessage = "Please enter your usename.";
			return( next() );

		}

		this._userService
			.authenticateUser( request.rc.username )
			.then(
				( user ) => {

					response.cookie( "sessionId", user.id );
					response.redirect( "/" );

				}
			)
			.catch(
				( error ) => {

					response.status( 401 );
					response.rc.errorMessage = "That username does not exist.";
					next();

				}
			)
			.catch( next )
		;

	}


	// I process the logout request.
	processLogout( request, response ) {

		response.cookie( "sessionId", "", { expires: new Date( 0 ) } );
		response.redirect( "/login" );

	}


	// I process the signup form.
	processSignup( request, response, next ) {

		// The processing action shares the same view as the form.
		response.rc.title = "Sign-up";
		response.setView( ".signup" );

		if ( ! request.rc.username ) {

			response.status( 400 );
			response.rc.errorMessage = "Please enter your desired usename.";
			return( next() );

		}

		this._userService
			.createUser( request.rc.username )
			.then(
				( userId ) => {

					response.cookie( "sessionId", userId );
					response.redirect( "/" );

				}
			)
			.catch(
				( error ) => {

					response.status( 400 );
					response.rc.errorMessage = "That username is already in use.";
					next();

				}
			)
			.catch( next )
		;

	}


	// I render the signup form.
	signup( request, response ) {

		response.rc.title = "Sign-up";
		
	}

}

exports.SecurityController = SecurityController;
