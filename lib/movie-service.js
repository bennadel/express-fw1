
// Require the application modules.
var deepClone = require( "./deep-clone" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

class MovieService {

	// I initialize the movie service.
	constructor() {

		this._inMemoryCache = {};

	}


	// ---
	// PUBLIC METHODS.
	// ---


	// I create a movie with the given name, owned by the given user. Returns a Promise.
	createMovie( userId, name ) {

		var promise = new Promise(
			( resolve, reject ) => {

				if ( ! name ) {

					throw( new Error( "Invalid Argument" ) );

				}

				var movies = this._paramMovies( userId );
				var movie = {
					id: Date.now(),
					name: name
				};

				// NOTE: We are sorting the movies on-safe so we don't have to sort them
				// every time we read the collection.
				movies.push( movie );
				movies.sort( this._sortOperator );

				resolve( movie.id );

			}
		);

		return( promise );

	}


	// I delete the given movie, owned by the given user. Returns a Promise.
	deleteMovie( userId, id ) {

		var promise = new Promise(
			( resolve, reject ) => {

				var movies = this._paramMovies( userId );
				var matchingIndex = movies.findIndex(
					( item ) => {

						return( item.id === id );

					}
				);

				if ( matchingIndex === -1 ) {

					throw( new Error( "Not Found" ) );

				}

				movies.splice( matchingIndex, 1 );
				resolve();

			}
		);

		return( promise );

	}


	// I get the movies for the given user. Returns a Promise.
	getMovies( userId ) {

		var promise = new Promise(
			( resolve, reject ) => {

				// NOTE: We have deep-clone the movies collection so that we don't let
				// an internal reference leak into the calling context.
				resolve( deepClone( this._paramMovies( userId ) ) );

			}
		);

		return( promise );

	}


	// ---
	// PRIVATE METHODS.
	// ---


	// I setup the movies collection for this user, if it doesn't exist, and returns a 
	// direct reference to the collection.
	_paramMovies( userId ) {

		if ( ! this._inMemoryCache[ userId ] ) {

			this._inMemoryCache[ userId ] = [];

		}

		return( this._inMemoryCache[ userId ] );

	}


	// I am the sort operator for the collection of movies.
	_sortOperator( a, b ) {

		var aName = a.name.toLowerCase().replace( /^(a|the) /, "" );
		var bName = b.name.toLowerCase().replace( /^(a|the) /, "" );

		if ( aName < bName ) {

			return( -1 );

		} else if ( aName > bName ) {

			return( 1 );

		} else {

			return( 0 );

		}

	}

}

exports.MovieService = MovieService;
