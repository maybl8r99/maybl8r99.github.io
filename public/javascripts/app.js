	angular.module('myChart',[])
		.factory('d3', function() {
			return d3
		});

	var app = angular.module('mainApp', ['ngRoute', 'myChart']);

	//var route = require('routes.js');

	app.controller("mainController",[
		'$scope', '$http','$routeParams','$location', '$window',
		function($scope, $http, $routeParams,$location, $window) {

		$scope.modeldata = {} // document collection in the DOM
		$scope.formdata = {} // form data in the DOM
		$scope.pageinfo = {} // pagination configuration
		$scope.errors = ''; // error log
		$scope.info = '';
		$scope.data = [10,20,30,40,60, 80, 20, 50];

		$scope.shared = {data:[1]};

		$scope.chartClicked = function() {
			var n = Math.round(Math.random() * 9) + 1;
			$scope.shared.data = d3.range(n).map(function (d) {
				return Math.random();
			});
		}

		var init = function() {
			console.log('Init '+$location);
			$scope.errors ='s';
		};

		init();
		$scope.clearmodel = function(model='none') {
			// clears the modeldata tree specifically or completely if no param
			if (model == 'none') {
				$scope.modeldata = {};
			} else {
				if ($scope.modeldata[model]) $scope.modeldata[model]={};			
			}
		}

		$scope.clearform = function(model='none') {
			// clears the formdata tree specifically or completely if no param
			if (model == 'none') {
				$scope.formdata = {};
			} else {
				if ($scope.formdata[model]) $scope.formdata[model]={};			
			}
		}

		$scope.numberofpages=function(model) {
			var dlength = 0;
			if ($scope.modeldata[model]) {
				dlength = $scope.modeldata[model].length;
				return Math.ceil(dlength / $scope.pageinfo[model]['pagesize']);
			} else {
				return 0;
			}
		}

		$scope.load = function(model, force=false) {
			if ($scope.pageinfo[model] &&
				$scope.pageinfo[model]['loaddate'] && 
				!force) {
				// this data has been loaded before. 
				// has it been minimumCycleSeconds seconds yet?
				var minimumCycleSeconds = 10,
					lastLoadDate = $scope.pageinfo[model]['loaddate'],
					currentDate = new Date,
					elapsedTime = currentDate - lastLoadDate;
				if (elapsedTime < (minimumCycleSeconds * 1000)) {
					$scope.info = 'Too early to load ' + (elapsedTime/1000) + '/'+ minimumCycleSeconds +' seconds';
					return false;
				}
			};
			$scope.pageinfo[model] = {
				'currentpage':0,
				'pagesize':10,
				'numpages': 1,
				'loaddate': new Date
			};
			$scope.modeldata[model]={};
			$http.get('/getCollection?col='+model)
				.success(function(data) {
					$scope.modeldata[model] = data;
					$scope.pageinfo[model]['numpages'] = $scope.numberofpages(model);
					$scope.pageinfo[model]['loaddate'] = new Date;
				})
				.error(function(err) {
					$scope.errors = 'ERROR Load['+model+'] Failed' + err ;
				});
		}

		$scope.loadDoc = function(model) {
			if ($routeParams['id']) {
				//console.log($routeParams['id']);
				var id = $routeParams['id'];
				$http.get('/getDocument?col='+model+'&id='+id)
					.success(function(data) {
						$scope.formdata[model] = data[0];
					})
					.error (function(err) {
						$scope.errors = 'ERROR Loading Document['+model+'] id=['+id+']\n'+ err;
					});
			}
		}

		$scope.save = function(model,data) {
			post_data = {col: model, data:data};
			$http.post("/addData", post_data)
				.success(function(res) {
					if($scope.formdata) {
						$scope.formdata = {};
					}
				})
				.error(function(res) {
					$scope.errors = res;
				});
		};

		$scope.update = function(model, data, urlifsuccess) {
			post_data = {col:model, data:data};
			$http.post("/updateData", post_data)
				.success(function(res) {
					$window.location.href = urlifsuccess;
				})
				.error(function(res) {
					$scope.errors = "FAILED updating[" + model+"]\n";
				});
		};

		$scope.deleteDocument = function(model, id) {
			post_data = {col:model, id:id};
			$http.post('/deleteDocument', post_data)
				.success(function(res) {
					$scope.load(model,true);
				})
				.error(function(err) {
					$scope.errors='FAILED deleting ['+model+']';
				});
		};
	}]);

	app.directive('donutChart', ['d3', function(d3) {

		//var data = [1,2,3,4,5];
		var draw = function(svg, width, height, data) {
			svg
				.attr('width', width)
				.attr('height', height);

			var margin = 30;

			var xScale = d3.scaleTime()
				.domain([
					d3.min(data, function(d) {return d.time;}),
					d3.max(data, function(d) {return d.time;})
					])
				.range([margin, width - margin]);

			// var xAxis = d3.svg.axis()
			// 	.scale(xScale)
			// 	.orient('top')
			// 	.tickFormat(d3.timeFormat('%S'));
			var xAxis = d3.axisLeft(xScale);

			var yScale = d3.scaleTime()
				.domain([0, d3.max(data, function(d) { return d.visitors;})])
				.range([margin, height - margin]);

			// var yAxis = d3.svg.axis()
			// 	.scale(yScale)
			// 	.orient('left')
			// 	.tickFormat(d3.format('f'));
			var yAxis = d3.axisTop(yScale);

			svg.select('.x-axis')
				.attr('transform', 'translate(0,' + margin + ')')
				.call(xAxis);

			svg.select('.y-axis')
				.attr('transform', 'translate(' + margin + ')')
				.call(yAxis);

			svg.select('.data')
				.selectAll('circle').data(data)
				.enter()
				.append('circle');

			svg.select('.data')
				.selectAll('circle').data(data)
				.attr('r',2.5)
				.attr('cx', function(d) { return xScale(d.time);})
				.attr('cy', function(d) { return yScale(d.visitors);})
		}

		return {
			scope: {
				data:'=',
			},
			restrict: 'E',
			compile: function(element, attrs, transclude){
				var el = d3.select(element[0]);
				var svg = el.append('svg');

				svg.append('g').attr('class','data');
				svg.append('g').attr('class','x-axis axis');
				svg.append('g').attr('class','y-axis axis');

				var width = 640, height = 480;

				return function(scope, element, attr) {
					scope.$watch('data', function(newVal, oldVal, scope) {
						draw(svg, width, height, scope.data);
						//draw(svg, width, height, [1,2,3,55,3,23,5]);
					}, true);
				}

			}
		}
	}]);

	app.filter('pagestartfrom', function() {
		/*
			Pagination filter.
		*/
		return function(input, start) {
			start = +start;
			if (input && typeof input.slice == 'function') {
				return input.slice(start);
			} else {
				return null;
			}
			
		}
	});