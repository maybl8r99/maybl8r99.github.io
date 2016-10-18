function importFile(f) {
	if (!$('html').data('loaded_'+f)) {
		$.getScript(f)
			.done(function () {
				$('html').data('loaded_'+f,1)
			})
			.fail(function () {
				console.log('Could not load '+f)
			});
	}

}

var getPixels = function (numerator,pctValue, defaultValue) {
	if (!isNaN(pctValue)) return(pctValue);
	if (pctValue.indexOf('%')>1) {
		var v = parseInt(pctValue);
		if (isNaN(v)) throw("Invalid value");
		var pixels = numerator * (v/100);
		return pixels;
	}
	if (typeof(defaultValue)=='undefined') defaultValue=100;
	return defaultValue;
}

Date.prototype.addHours = function(h) {
	this.setTime(this.getTime() + (h*60*60*1000));
	return this;
}

var spindatalog = function() {
	var _data = [];
	var _depth = 0;
	var _progress = 0;
	var fixedprogress = true;
	for (i=0; i<(50000/10)+Math.random()*200;i++) {
		var _d = {
			depth:_depth,
			rop:Math.random()*10,
			wob:Math.random()*11,
			rpm:Math.floor(Math.random()*15),
			torque:Math.floor(Math.random()*1200),
			spp:Math.floor(Math.random()*200),
			flowpump:Math.floor(Math.random()*220)
		};
		_data.push(_d);
		_progress = fixedprogress?10:Math.random()*10;
		_depth = _depth + _progress;
	}
	return _data;
}

var spindata = function() {
	//var _data = [{'series1':[]},{'series2':[]}];
	var _data = [];
	var startDate = new Date("1 January 2000");
	var _newDate = new Date(startDate.setTime(startDate.getTime() + Math.random()*30000));
	var _depth = 0;
	var _progress = 0;
	var _dur = function() { return Math.random()*10000000;}
	var _cost = Math.random()*10000;
	var _class = function() {return Math.floor(Math.random()*4)};
	var _classduration = [];
	for (i=0;i<100+Math.random()*200;i++) {
		__dur = _dur();
		__class = _class();
		_progress = Math.random()*400;
		if (__class==0||__class==1) _progress = 0;
		var _d = {date: _newDate, progress:_progress,
							depth: _depth, cost: _cost, class:__class, duration:__dur,
							classduration: _classduration};
		if (!_d['classduration'][__class]) _d['classduration'][__class] = 0;
				_d['classduration'][__class] = _d['classduration'][__class] + __dur;
		//var _series = _data.series1;
		_data.push(_d);
		_newDate = new Date(_newDate.setTime(_newDate.getTime() + __dur));
		_depth = _depth + _progress;
		_cost = _cost + Math.random()*2000;
	}
	//console.log(_data);
	return _data;
}

var processDVDData = function(_data, _dataNoDT) {
	var lastdur = 0;
	var lastdepth = 0;
	if (!_data || _data.length<1) return false;

	_dataNoDT = []; // reset NoDT array
	_data.forEach(function(_datum, idx, arr) {
		if (typeof _datum['progress'] == 'undefined')
			_data[idx]['progress'] = _datum['depth'] - lastdepth;
		_data[idx]['cumulativeduration'] = _datum['duration'] + lastdur;
		_data[idx]['rop'] = _data[idx]['progress'] / _datum['duration'];
		lastdur = _data[idx]['cumulativeduration'];
		lastdepth = _datum['depth'];
		// if it's not a class 0 - deep copy it to _dataNoDT
		if (_data[idx]['class'] > 0) {
			_dataNoDT.push($.extend(true,[],_data[idx]));
			_data[idx]['DT'] = 0;
		} else {
			_data[idx]['DT'] = _datum['duration'];
		}
	});

	// process NoDT
	lastdur = 0;
	lastdepth = 0;
	_dataNoDT.forEach(function(_datum, idx, arr) {
		_dataNoDT[idx]['progress'] = _datum['depth'] - lastdepth;
		_dataNoDT[idx]['cumulativeduration'] = _datum['duration'] + lastdur;
		_dataNoDT[idx]['rop'] = _dataNoDT[idx]['progress'] / _datum['duration'];
		lastdur = _dataNoDT[idx]['cumulativeduration'];
		lastdepth = _datum['depth'];
	});

	return {'data':_data,'dataNoDT':_dataNoDT};
}

var csvtsv2data = function(_data) {
	var header = [];
	if (!_data || _data.length < 1) {
		console.log('no data to process');
		alert('No data to process');
		return false;
	}
	var lines = _data.split('\n');
	var type = 'csv';
	var delim = ',';
	var data = [];
	//console.log(lines.length);
	if (lines.length>1) {
		header = lines[0].split(',');
		if (header.length<2) {
			header = lines[0].split('\t');
			if (header.length<1) return false;
			type = 'tsv';
			delim = '\t';
		} else {
			type='csv';
		}
	}
	console.log('Type',type);
	header.forEach(function(d,i) {
		var _v = d.toLowerCase().trim();
		header[i] = _v;
		//console.log(_v);
	});
	for (x=1; x < lines.length;x++) {
		var fields = lines[x].split(delim);
		var rec = {};
		fields.forEach(function(v,k) {
			if (isNaN(v)) {
				rec[header[k]] = v;
			} else {
				rec[header[k]] = Number(v);
			}
			
		});
		data.push(rec);
	}
	console.log('processed ',data.length,' lines');
	return data;
}

