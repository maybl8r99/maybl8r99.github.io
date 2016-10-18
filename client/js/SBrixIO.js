app.service('SBrixIO', ['$http','$log',
	function($http, $log) {

	var config	= [];
	var data 	= [];
	var error 	= [];

	config['URL'] = 'http://localhost:3000';
	
	this.getURL = function() {
		return config['URL'];
	}

	this.setURL = function(str) {
		config['URL'] = str;
	}

	this.getDoc = function(model, condition, callback) {
		error = [];
		var url = '/getDocument';

		$http.get(url,condition)
			.success(function(d) {
				data = d;
				return callback({'data':d});
			})
			.error(function(e) {
				return callback({'data':null,
				'error':e});
			});
	}

	this.getCol = function(model, callback) {
		error = [];
		var url = '/getCollection';
		$http.get(url+'?col='+model)
			.success(function(d) {
				data[model] = d;
				$log.info(d.length);
				return callback({'data':data[model],
					'error':error});
			})
			.error(function(e) {
				data[model] = {};
				error.push(e);
				return callback({'data':data[model],
					'error':error});
			});
	}

	this.postDoc = function(model, data, callback) {
		error=[];
		postdata = {
			'col':model,
			'data':data
		};
		var url = '/addDocument';
		$http.post(url, postdata)
			.success(function(d) {
				$log.info('POST to ['+model+'] DONE');
				return callback(false,{});
			})
			.error(function(e){
				$log.error('ERROR POSTING to['+model+']');
				return callback(true,e);
			});
	}


}]);