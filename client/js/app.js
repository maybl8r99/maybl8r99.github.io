var app = angular.module('brixmindApp', ['ngRoute','ui']);

app.controller("mainController",[
	'$scope', '$http','$routeParams','$location', '$window', '$log',
	'SBrixIO',
	function($scope, $http, $routeParams,$location, $window, $log,
		SBrixIO) {

		$scope.modeldata = {}; // document collection in the DOM
		$scope.formdata = {}; // form data in the DOM
		$scope.modelnames = [
			{'name':'users'},
			{'name':'institution'},
			{'name':'article'}
		];

		$scope.graphdata = [];
		$scope.dvddata = [];
		$scope['groupBy'] = ['wellname','formation'];
		$scope['groupedData'] = {};
		$scope['data'] = [];
		$scope['dataColumns'] = [];
		$scope['testvar'] = 'hello world';
		$scope['filter'] = {};
		$scope['context'] = {};
		$scope['events'] = {};
		$scope['dataFileUrl'] = '/data/multi-well.csv';

		$scope.clearmodel = function(model) {
			// clears the modeldata tree specifically or completely if no param
			if (typeof model == 'undefined') {
				$scope.modeldata = {};
				$log.info('Cleared Model Data [ALL]');
			} else {
				if ($scope.modeldata[model]) $scope.modeldata[model]={};
			}
		}

		$scope.clearform = function(model) {
			// clears the formdata tree specifically or completely if no param
			if (typeof model == 'undefined') {
				$scope.formdata = {};
				$log.info('Cleared Form Data [ALL]');
			} else {
				if ($scope.formdata[model]) $scope.formdata[model]={};
			}
		}

		$scope.loadDocById = function(model,id) {
			//_var = SBrixIO.get('/getDocument', )
			_var = SBrixIO.getDoc(model,{'id':id}, function(d) {
				var data = d['data'];
				var error = d['error'];
				if (data) {
					$scope.formdata[model] = data;
				}
			})
		}

		$scope.load = function(model) {
			_var = SBrixIO.getCol(model, function(d) {
				if (d['data']) $scope.modeldata[model] = d['data'];
			});
		}

		$scope.save = function(model, data) {
			_var = SBrixIO.postDoc(model, data, function(err,d) {
				if (err) {
					$log.error(JSON.stringify(d));
				}
			});
		}

		$scope.alert = function(msg) {
			alert(msg);
			$log.info(msg);
		}

		$scope.resetContext= function() {
			$scope.context = null;
			console.log('blip');
		}

		$scope.generategraphdata = function() {
			//$log.info('generating data');
			$scope.dvddata = [];
			$scope.dvddata = spindata();
			$scope.welllogdata = [];
			$scope.welllogdata = spindatalog();
			//console.log($scope.welllogdata);
		}

		$scope.text2data = function(m,scopedata) {
			var t = csvtsv2data(m);
			$scope[scopedata] = t;
			//console.log(t);
		}

		$scope.loadDataFrom = function(url) {
			console.time('loadDataFrom');
			$.get(url, function(d) {
				var dd = csvtsv2data(d);
				$scope['data'] = dd;
				var columns = [];
				var wellList = [];
				for (var p in dd[0]) {columns.push(p);}
				for (var g in $scope.groupBy) {
					var k = $scope.groupBy[g];
					$scope.groupedData[k] = [];
					dd.filter(function(_d) {
						if ($scope.groupedData[k].indexOf(_d[k])<0) $scope.groupedData[k].push(_d[k]);
					})
				}
				if ($scope.groupedData['wellname']) $scope['wellList'] = $scope.groupedData['wellname'];
				$scope.$apply();
			})
			.always(function() {
				console.timeEnd('loadDataFrom');
			})
		}
		$scope.clearmodel();
		$scope.clearform();


		if ($window.dataFileUrl) $scope.dataFileUrl = $window.dataFileUrl;
	}
]);

