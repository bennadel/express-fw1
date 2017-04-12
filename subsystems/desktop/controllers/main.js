
class MainController {

	// I initialize the controller.
	constructor() {
		// ...
	}


	// ---
	// LIFE-CYCLE METHODS.
	// ---


	// I get called before every single request to this controller.
	onBefore( request, response ) {

		// All requests to this controller must be made by authenticated users. If the
		// user is not authenticating, redirect the user back to the login page.
		if ( ! request.rc.user.isAuthenticated ) {

			response.redirect( "/login?redirect=" + encodeURIComponent( request.url ) );

		}

	}

}

exports.MainController = MainController;
