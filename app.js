
// Require the core node modules.
var bodyParser = require( "body-parser" );
var cookieParser = require( "cookie-parser" );
var express = require( "express" );
var logger = require( "morgan" );
var path = require( "path" );

// Require the application node modules.
var fw1 = require( "./fw1" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// Require the Services.
var MovieService = require( "./lib/movie-service" ).MovieService;
var UserService = require( "./lib/user-service" ).UserService;

// Require the life-cycle controllers.
var SubsystemsLifeCycle = require( "./subsystems/lifecycle" ).SubsystemsLifeCycle;
var ApiLifeCycle = require( "./subsystems/api/lifecycle" ).ApiLifeCycle;
var DesktopLifeCycle = require( "./subsystems/desktop/lifecycle" ).DesktopLifeCycle;

// Require the normal controllers.
var controllers = {
	desktop: {
		MainController: require( "./subsystems/desktop/controllers/main" ).MainController,
		SecurityController: require( "./subsystems/desktop/controllers/security" ).SecurityController
	},
	api: {
		MoviesController: require( "./subsystems/api/controllers/movies" ).MoviesController
	}
};

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

var movieService = new MovieService();
var userService = new UserService();

var app = module.exports = express();

// Setup the view engine.
// --
// CAUTION: The fw1() middleware expects view root to be the working directory.
app.set( "views" , __dirname );
app.set( "view engine" , "pug" );

// Setup global middleware.
// --
// TODO: This could be moved inside fw1() somehow to include common default middlewares.
// But, then I would need to give fw1 access to the app somehow.
app.use( logger( "dev" ) );
app.use( cookieParser() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );
app.use( express.static( path.join( __dirname, "public" ) ) );

// Setup fw1 controllers and routes.
app.use(
	fw1(
		// Define the subsystems and controllers. These are actual instances of the 
		// various controllers that fw1 will invoke based on the incoming route.
		{
			desktop: {
				main: new controllers.desktop.MainController(),
				security: new controllers.desktop.SecurityController( userService )
			},
			api: {
				movies: new controllers.api.MoviesController( movieService )
			}
		},

		// Define the global life-cycle controllers. These handle request-level and 
		// subsystem-level shared concerns like authentication and error handling.
		// --
		// NOTE: The "subsystems" is the root-level handler - this is a special name. The
		// rest of the names have to match the names of individual subsystems.
		{
			subsystems: new SubsystemsLifeCycle( userService ),
			api: new ApiLifeCycle(),
			desktop: new DesktopLifeCycle()
		},

		// Define the route mappings. 
		// --
		// NOTE: The order here is not important since any pre/post route middleware 
		// should be handled by the life-cycle methods.
		{
			// Desktop routes.
			"GET /": "desktop:main.default",
			"GET /login": "desktop:security.login",
			"POST /login": "desktop:security.processLogin",
			"GET /sign-up": "desktop:security.signup",
			"POST /sign-up": "desktop:security.processSignup",
			"GET /logout": "desktop:security.processLogout",

			// API routes.
			"GET /api/movies": "api:movies.getMovies",
			"POST /api/movies": "api:movies.createMovie",
			"DELETE /api/movies/:movieId": "api:movies.deleteMovie"
		}
	)
);
