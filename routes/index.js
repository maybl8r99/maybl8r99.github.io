var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Models = {};
var Scope = {};
var _m = mongoose.modelNames(); // get all schema names defined
_m.forEach(function(m) {
	console.log('Processing model ['+m+']');
	Models[m] = mongoose.model(m);
})

router.get('/', function(req,res) {
	res.render('index-angular2', {
		title:'Node Experiment part deux.',
	});
});


router.get('/getCollection', function(req,res) {
	// Generic load data
	// the model name is defined in the query parameter 'm'
	var model = req.query['col'];
	if (model && Models[model]) {
		Models[model].find(function(err,data) {
			if (err) {
				res.status(400).send('ERROR LOADING ['+model+']');
			} else {
				console.log(data.length + ' records retrieved from ['+model+'].');
				res.send(data);
			}
		});
	} else {
		res.status(400).send('ERROR No model defined');
	}
});

router.get('/getDocument', function(req,res) {
	var model = req.query['col'],
		id = req.query['id'];
	if (model && Models[model]) {
		Models[model].find({_id:id},function(err, data) {
			if (err) {
				res.status(400).send('ERROR LOADING ['+model+'] id=['+id+']\n'+err);
			} else {
				res.send(data);
			}
		});
	} else {
		res.status(400).send('ERROR No valid models found');
	}
});

router.post('/deleteDocument', function(req,res) {
	var model = req.body['col'],
		id = req.body['id'];
	if (model && Models[model]) {
		Models[model].remove({_id:id}, function(err) {
			if (err) {
				console.log(err);
				res.status(400).send('ERROR DELETING ['+model+'] Document');
			} else {
				res.status(200).send('ok');
			}
		});
	} else {
		res.status(400).send('ERROR No valid models found');
	}
});

router.post('/addDocument', function(req, res) {
	// Generic method to save data
	// requires that the schamas are loaded into the Models object
	// the "model" name is pushed and checked to see if it exists 
	var model = req.body['col'],
		data = req.body['data'],
		status_good = true;
	if (Models[model]) {
		var _M = new Models[model](data);
		var _error = _M.validateSync();
		if (_error) {
			//console.log("ERROR:"+JSON.stringify(_error));
			Scope['error'] = _error;
			status_good = false;
		} else {
			_M.save(function(err) {
				if (err) {
					console.log("Save FAILED for model ["+model+"]");
					status_good = false;
				}
			});
		}

	} else {
		console.log("Error. Model ["+model+"] NOT FOUND.");
		status_good = false;
	}

	if (status_good) {
		res.status(200).send(JSON.stringify(data));
	} else {
		res.status(400).send(Scope);
	}
});

router.post('/updateData', function(req, res) {
	var model = req.body['col'],
		data = req.body['data'];
	if (data['_id']) {
		var _M = Models[model].findOneAndUpdate({_id:data['_id']}, data,function(err, newdata) {
			if (err) {
				res.status(400).send("Error updating ["+model+"]");
			} else {
				res.status(200).send("OK updating ["+model+"]");
			}
		});
	} else {
		res.status(400).send("ERROR no ID found");
	}
});


router.get('/getSchema', function(req, res) {
	var schemaName = req.query['schemaName'];
	var model = Models[schemaName];
	if (model) {
		res.type('application/json');
		res.send(model.schema.paths);
	} else {
		res.status(400).send("["+schemaName+"] NOT FOUND");
	}
});

router.get('/xydata', function(req,res) {
	var data=[],
		startDepth=0,
		lastDepth = 0,
		startDate= new Date('2011-01-01T00:00:00'),
		lastDate = startDate,
		max = 1000,
		min = 0;
	for (var i = 0; i < 1000; i++) {
		var x = Math.random() * 50;
		var y = Math.random() * 6000,
		lastDepth = startDepth + x;
		lastDate = new Date(startDate.getTime() + (y * 60000));
		data.push({'id':i,'depth':lastDepth,'datetime': lastDate.toISOString()});
		startDepth = lastDepth;
		startDate = lastDate;
		//console.log(x+'-'+date);
	}
	res.send(data);
});

module.exports = router;
