
class MoviesController {

	// I initialize the controller.
	constructor( movieService ) {

		this._movieService = movieService;

	}


	// ---
	// HANDLER METHODS.
	// ---


	// I create a movie with the provided name.
	createMovie( request, response, next ) {

		this._movieService
			.createMovie( request.rc.user.id, request.rc.name )
			.then(
				( movieId ) => {

					response.rc.data = movieId;

				}
			)
			.then( next )
			.catch( next )
		;

	}


	// I delete a movie with the provided id.
	deleteMovie( request, response, next ) {

		this._movieService
			.deleteMovie( request.rc.user.id, +request.rc.movieId )
			.then(
				() => {

					response.rc.data = true;

				}
			)
			.then( next )
			.catch( next )
		;

	}


	// I get the movies for the context users.
	getMovies( request, response, next ) {

		this._movieService
			.getMovies( request.rc.user.id )
			.then(
				( movies ) => {

					response.rc.data = movies;

				}
			)
			.then( next )
			.catch( next )
		;

	}

}

exports.MoviesController = MoviesController;
