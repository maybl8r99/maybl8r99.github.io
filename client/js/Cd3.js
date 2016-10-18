app.controller("d3Controller",[
	'$scope', '$http','$location', '$window', '$log',
	'SBrixIO',
	function($scope, $http ,$location, $window, $log,
		SBrixIO) {

		$scope.d3_update = function() {
			//$log.info($scope.d3_selected_model);
		}
	}
]);