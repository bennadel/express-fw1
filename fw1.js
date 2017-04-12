
// Require the core node modules.
var chalk = require( "chalk" );
var express = require( "express" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

module.exports = function fw1( controllers, lifecycleControllers, routeMappings ) {

	var router = express.Router();

	// Mount each route to run through a series of FW1 route-related middleware.
	Object.entries( routeMappings ).forEach(
		( [ routeRequest, routeController ] ) => {

			setupMiddlewareForRouteMapping( routeRequest, routeController );

		}
	);

	// After the routes are configured, we need to add some router-global middleware
	// that need to run regardless of whether or not a specific route was matched.
	router.use([
		notFoundMiddleware,
		controllerErrorMiddleware,
		subsystemErrorMiddleware,
		requestErrorMiddleware,
		renderMiddleware,
		fatalErrorMiddleware
	]);

	return( router );


	// ------------------------------------------------------------------------------- //
	// ------------------------------------------------------------------------------- //


	// I mount the route and setup the fw1 namespace.
	function setupMiddlewareForRouteMapping( routeRequest, routeController ) {

		var routeParts = routeRequest.split( " " );

		// Determine which HTTP METHOD to mount with.
		if ( routeParts.length === 1 ) {

			var routeMethod = "all";
			var routePath = routeRequest;

		} else {

			var routeMethod = routeParts[ 0 ].toLowerCase();
			var routePath = routeParts[ 1 ];

		}

		var controllerParts = parseControllerNotation( routeController );

		// CAUTION: All, some, or none of these properties will actually exist on the
		// controllers collection since there is no guarantee that we're actually using
		// controllers to process the request. If a request only has view assets, then
		// there will be no associated controller (but, we'll parameterize what we can
		// below so as to make the request processing easier).
		var subsystemName = controllerParts.subsystemName;
		var controllerName = controllerParts.controllerName;
		var methodName = controllerParts.methodName;

		// Let's param the various controllers so that we don't actually have to check to
		// see if they exist when processing the middleware.

		// Param request-level life-cycle controller.
		// --
		// NOTE: Since this one isn't really tied to a route, it will be called many 
		// times unnecessarily; but, I'm keeping it here, regardless, so that all of the
		// controller parameterization is in the same place. This is only done on app
		// start-up, so the cost isn't a significant consideration.
		if ( ! lifecycleControllers.subsystems ) {

			lifecycleControllers.subsystems = Object.create( null );

		}

		// Param subsystem-level life-cycle controller.
		if ( ! lifecycleControllers[ subsystemName ] ) {

			lifecycleControllers[ subsystemName ] = Object.create( null );

		}

		// Param subsystem collection.
		if ( ! controllers[ subsystemName ] ) {

			controllers[ subsystemName ] = Object.create( null );

		}

		// Param subsystem controller.
		if ( ! controllers[ subsystemName ][ controllerName ] ) {

			controllers[ subsystemName ][ controllerName ] = Object.create( null );

		}

		// Mount the route middleware.
		router[ routeMethod ](
			routePath,
			function initializeRequest( request, response, next ) {

				request.fw1 = {
					subsystemName: subsystemName,
					controllerName: controllerName,
					methodName: methodName,

					// At this time, these are just here for debugging.
					route: {
						method: routeMethod,
						path: routePath,
						controller: routeController
					}
				};

				response.fw1 = {
					// NOTE: The request and response values are stored separately 
					// because the response values can be overridden to render views 
					// that are not inherently tied to the request values.
					subsystemName: subsystemName,
					controllerName: controllerName,
					methodName: methodName
				};

				// By default, the view is calculated based on the request route mapping;
				// however, a controller can explicitly set the view to be used when 
				// rendering the output. This view uses the controller notation which 
				// means it can be relative to a context:
				// --
				// Relative to Controller: ".method"
				// Relative to Subsystem: "controller.method"
				// Relative to Root: "subsystem:controller.method"
				response.setView = function( controllerNotation ) {

					var config = parseControllerNotation( controllerNotation );

					// In order to make the notation relative, pull from the request any
					// portions that are undefined in the parsed value.
					response.fw1.subsystemName = ( config.subsystemName || request.fw1.subsystemName );
					response.fw1.controllerName = ( config.controllerName || request.fw1.controllerName );
					response.fw1.methodName = ( config.methodName || request.fw1.methodName );

				};

				// Setup the "request collection" that unifies the access to the 
				// various request inputs and response outputs. Since this is built 
				// on top of the response.locals collection, it will be available 
				// within the view rendering.
				applyRequestCollection( request, response );

				next();

			},
			// The rest of the middleware (on this route) here can now assume that the
			// "fw1" object exists on both the request and the response.
			beforeRequestMiddleware,
			beforeSubsystemMiddleware,
			beforeControllerMiddleware,
			executeControllerMiddleware,
			afterControllerMiddleware,
			afterSubsystemMiddleware,
			afterRequestMiddleware
		);

	}


	// I run before every fw1 request.
	function beforeRequestMiddleware( request, response, next ) {

		safelyInvokeController( lifecycleControllers[ "subsystems" ], "onBefore", request, response, next );

	}


	// I run before every fw1 request in the current subsystem.
	function beforeSubsystemMiddleware( request, response, next ) {

		var subsystemName = request.fw1.subsystemName;

		safelyInvokeController( lifecycleControllers[ subsystemName ], "onBefore", request, response, next );
		
	}


	// I run before every fw1 request in the current controller.
	function beforeControllerMiddleware( request, response, next ) {

		var subsystemName = request.fw1.subsystemName;
		var controllerName = request.fw1.controllerName;

		safelyInvokeController( controllers[ subsystemName ][ controllerName ], "onBefore", request, response, next );
		
	}


	// I execute the actual controller method in the request.
	function executeControllerMiddleware( request, response, next ) {

		var subsystemName = request.fw1.subsystemName;
		var controllerName = request.fw1.controllerName;
		var methodName = request.fw1.methodName;

		safelyInvokeController( controllers[ subsystemName ][ controllerName ], methodName, request, response, next );
		
	}


	// I run after every fw1 request in the current controller.
	function afterControllerMiddleware( request, response, next ) {

		var subsystemName = request.fw1.subsystemName;
		var controllerName = request.fw1.controllerName;

		safelyInvokeController( controllers[ subsystemName ][ controllerName ], "onAfter", request, response, next );
		
	}


	// I run after every fw1 request in the current subsystem.
	function afterSubsystemMiddleware( request, response, next ) {

		var subsystemName = request.fw1.subsystemName;

		safelyInvokeController( lifecycleControllers[ subsystemName ], "onAfter", request, response, next );
		
	}


	// I run after every fw1 request.
	function afterRequestMiddleware( request, response, next ) {

		safelyInvokeController( lifecycleControllers[ "subsystems" ], "onAfter", request, response, next );
		
	}


	// I check to see if the current request was caught by a fw1 route mapping; and, if
	// not, throw a Not Found error.
	// --
	// CAUTION: This assumes that static asset service was configured to run before the
	// fw1 request middleware.
	function notFoundMiddleware( request, response, next ) {

		if ( isFw1Request( request ) ) {

			return( next() );

		}

		// If we made it this far in the request and the request was not associated with
		// a mapped route that initialized the fw1 object, then this request will not be
		// handled by one of the controllers.
		var error = new Error( "Not Found" );
		error.status = 404;

		throw( error );

	}


	// I attempt to pipe error-handling into the current controller (if available).
	function controllerErrorMiddleware( error, request, response, next ) {

		if ( isFw1Request( request ) ) {

			var subsystemName = request.fw1.subsystemName;
			var controllerName = request.fw1.controllerName;

			safelyInvokeController( controllers[ subsystemName ][ controllerName ], "onError", error, request, response, next );
			
		} else {

			next( error );

		}

	}


	// I attempt to pipe error-handling into the current subsystem life-cycle controller.
	function subsystemErrorMiddleware( error, request, response, next ) {

		if ( isFw1Request( request ) ) {

			var subsystemName = request.fw1.subsystemName;

			safelyInvokeController( lifecycleControllers[ subsystemName ], "onError", error, request, response, next );

		} else {

			next( error );

		}

	}


	// I attempt to pipe error-handling into the root life-cycle controller.
	function requestErrorMiddleware( error, request, response, next ) {

		// If this isn't a fw1 request by the time we hit the root-level error handler,
		// then we need to inject enough of the fw1 functionality so that the root-level
		// error handler can define the view that should be used to render the not-found
		// error message.
		if ( ! isFw1Request( request ) ) {

			response.fw1 = {
				subsystemName: "",
				controllerName: "",
				methodName: ""
			};

			// The root level error handler NEEDS TO CALL THIS METHOD in order to be able
			// to render the error message in a view.
			response.setView = function( controllerNotation ) {

				var config = parseControllerNotation( controllerNotation );

				response.fw1.subsystemName = config.subsystemName;
				response.fw1.controllerName = config.controllerName;
				response.fw1.methodName = config.methodName;

			};

			applyRequestCollection( request, response );

		}

		safelyInvokeController( lifecycleControllers[ "subsystems" ], "onError", error, request, response, next );

	}


	// I render the view after the controllers have been invoked.
	function renderMiddleware( request, response, next ) {

		var subsystemName = response.fw1.subsystemName;
		var controllerName = response.fw1.controllerName;
		var methodName = response.fw1.methodName;

		if ( ! ( subsystemName && controllerName && methodName ) ) {

			throw( new Error( `The response has not been sufficiently defined.` ) );

		}

		// CAUTION: We're not passing any "locals" into the view rendering because 
		// we're depending on the fact that the "response.locals" is already available,
		// which is the basis for our "rc" (request collection) property.
		response.render( `subsystems/${ subsystemName }/views/${ controllerName }/${ methodName }` );

	}


	// I handle any errors generated during view-rendering.
	function fatalErrorMiddleware( error, request, response, next ) {

		// If we made it this far, it means that either the application has no error 
		// handling; or, that the error handling itself failed; or that the view 
		// rendering also failed. Basically, we should never make it this far unless
		// something really bad happened.
		console.log( chalk.red.bold( "Fatal Error" ) );
		console.log( error );

		response
			.status( 500 )
			.send( "Unexpected Error" )
		;

	}


	// ------------------------------------------------------------------------------- //
	// ------------------------------------------------------------------------------- //


	// I inject the request collection into the request and response as a shared object
	// reference (ie, changes in one will be reflected in changes in the other). The "rc"
	// is based on the request.locals collection and is then augmented with the other 
	// request-based values.
	function applyRequestCollection( request, response ) {

		var rc = request.rc = response.rc = response.locals;

		Object.assign( rc, request.app.locals );
		Object.assign( rc, request.query );
		Object.assign( rc, request.params );
		Object.assign( rc, request.body );

	}


	// I determine if the given request has been picked-up as a FW1 request.
	function isFw1Request( request ) {

		return( request.hasOwnProperty( "fw1" ) );

	}


	// I parse the given controller notation into a has that contains the subsystemName,
	// controllerName, and methodName tokens. If parts of the notation are missing, the
	// resultant token will be null.
	function parseControllerNotation( token ) {

		var config = {
			subsystemName: null,
			controllerName: null,
			methodName: null
		};

		// Trying to parse the combinations:
		// --
		// subsystem : controller . method
		var subsystemPattern = /^(\w+):(\w+)\.(\w+)$/;
		// controller . method
		var controllerPattern = /^(\w+)\.(\w+)$/;
		// . method
		var methodPattern = /^\.?(\w+)$/;

		var parts = null;

		if ( parts = token.match( subsystemPattern ) ) {

			config.subsystemName = parts[ 1 ];
			config.controllerName = parts[ 2 ];
			config.methodName = parts[ 3 ];

		} else if ( parts = token.match( controllerPattern ) ) {

			config.controllerName = parts[ 1 ];
			config.methodName = parts[ 2 ];

		} else if ( parts = token.match( methodPattern ) ) {

			config.methodName = parts[ 1 ];

		} else {

			throw( new Error( `Unexpected controller notation [${ token }].` ) );

		}

		return( config );

	}


	// I invoke the given method on the given controller; or, safely skip over the 
	// invocation, passing control on to the next middleware.
	function safelyInvokeController( controller, methodName, ...methodArgs ) {

		var error = methodArgs[ 0 ];
		var request = methodArgs[ methodArgs.length - 3 ];
		var response = methodArgs[ methodArgs.length - 2 ];
		var next = methodArgs[ methodArgs.length - 1 ];
		var isError = ( methodArgs.length === 4 );

		// If the controller doesn't have the given method, pass flow of control on to
		// the next appropriate middleware (error or otherwise).
		if ( ! controller[ methodName ] ) {

			return( isError ? next( error ) : next() );

		}

		controller[ methodName ]( ...methodArgs );

		// If the number of arguments defined on the method signature does not match the
		// number of arguments available in the call, let's assume that we have to invoke
		// the next() middleware method explicitly since the target method does not have
		// a local parameter bound to the "next" argument.
		// --
		// WARNING: Assumes that the controller method is fully synchronous.
		if ( controller[ methodName ].length !== methodArgs.length ) {

			// Only call next if the response has not already been committed. If the 
			// headers have been sent, we have to assume that the previous Controller
			// method call has finalized the response.
			if ( ! response.headersSent ) {

				next();
				
			}

		}

	}

};
