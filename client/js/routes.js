app.config(function($routeProvider){
	$routeProvider
	.when('/', {
		templateUrl: 'templates/main.html'
	})
	.when('/users', {
		templateUrl: 'templates/users/listusers.html'
	})
	.when('/edituser', {
		templateUrl: 'templates/users/editusers.html'
	})
	.when('/dashboard', {
		templateUrl: 'templates/d3/index.html'
	})
	.when('/d3', {
		templateUrl: 'templates/d3_v1.html'
	})
	.when('/welllog', {
		templateUrl: 'templates/d3/welllog.html'
	})
	.when('/multiwell', {
		templateUrl: 'templates/d3/multiwell.html'
	})
	.when('/canvasbasic', {
		templateUrl: 'templates/d3/canvasbasic.html'
	})
	.otherwise({
		redirectTo: '/'
	});
});

/*
app.config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('root', {
				url:'/',
				templateUrl:'templates/main.html',
			})
			.state('d3', {
				url:'/d3',
				templateUrl:'templates/d3_v1.html',
			})
			.state('scratch', {
				url:'/scratch',
				templateUrl:'templates/scratch.html',
			})
	}]);
*/