
// Require the application modules.
var deepClone = require( "./deep-clone" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

class UserService {

	// I initialize the user service.
	constructor() {

		this._inMemoryCache = {};
		this._inMemoryCacheByUsername = {};

	}


	// ---
	// PUBLIC METHODS.
	// ---


	// I authenticate the given username (ie, make sure that the user exists). Returns a 
	// Promise.
	// --
	// CAUTION: This is _clearly_ "play" authentication. In a real application, you'd
	// need to have something like a password involved in authentication.
	authenticateUser( username ) {

		var promise = new Promise(
			( resolve, reject ) => {

				var user = this._inMemoryCacheByUsername[ username.toLowerCase() ];

				if ( ! user ) {

					throw( new Error( "Not Found" ) );

				}

				// NOTE: We have deep-clone the user object so that we don't let an 
				// internal reference leak into the calling context.
				resolve( deepClone( user ) );

			}
		);

		return( promise );

	}


	// I create the given user. Returns a Promise.
	createUser( username ) {

		var promise = new Promise(
			( resolve, reject ) => {

				if ( this._userExists( username ) ) {

					throw( new Error( "Already Exists" ) );

				}

				var user = {
					id: Date.now(),
					username: username
				};

				this._inMemoryCache[ user.id ] = user;
				this._inMemoryCacheByUsername[ username.toLowerCase() ] = user;

				resolve( user.id );

			}
		);

		return( promise );

	}


	// I get the user with the given id. Returns a Promise.
	getUser( id ) {

		var promise = new Promise(
			( resolve, reject ) => {

				var user = this._inMemoryCache[ id ];

				if ( ! user ) {

					throw( new Error( "Not Found" ) );

				}

				// NOTE: We have deep-clone the user object so that we don't let an 
				// internal reference leak into the calling context.
				resolve( deepClone( user ) );

			}
		);

		return( promise );

	}


	// ---
	// PRIVATE METHODS.
	// ---


	// I determine if the given username is already in use.
	_userExists( username ) {

		return( this._inMemoryCacheByUsername.hasOwnProperty( username.toLowerCase() ) );

	}

}

exports.UserService = UserService;
