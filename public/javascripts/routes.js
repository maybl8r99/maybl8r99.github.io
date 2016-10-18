	app.config(function($routeProvider){
		$routeProvider
		.when('/', {
			templateUrl: 'templates/index.html'
		})
		.when('/addArticle', {
			templateUrl: 'templates/partials/addArticle.html'
		})
		.when('/addInstitute',{
			templateUrl: 'templates/partials/addInstitution.html'
		})
		.when('/addUser', {
			templateUrl: 'templates/partials/addUser.html'
		})
		.when('/editArticle', {
			templateUrl: 'templates/partials/editArticle.html'
		})
		.when('/editInstitute',{
			templateUrl: 'templates/partials/editInstitution.html'
		})
		.when('/editUser', {
			templateUrl: 'templates/partials/editUser.html'
		})
		.when('/listUsers',{
			templateUrl: 'templates/partials/listUsers.html'
		})
		.when('/listInstitutions',{
			templateUrl: 'templates/partials/listInstitutions.html'
		})
		.when('/listArticles',{
			templateUrl: 'templates/partials/listArticles.html'
		})
		.when('/d3',{
			templateUrl: 'templates/partials/d3.html'
		})
		.otherwise({
			redirectTo: '404'
		});
	});
