/*
	Author: Reuben Wee
	Date:	17 September 2016

	requires
	* jquery
	* d3js v4

	To Do:

	* "tooltip" on all intersected series (with hoverLine)
	* Survey 3D rotation

	Done:

	* HoverLine - 2016-09-19
*/

app.directive('dvdlinechart',
	['$window', '$document', function($window, $document) {

	// DVD (Days Vs. Depth) Line Chart

	var directiveDefObj = {
		restrict: 'E',
		templateUrl: '/templates/d3/dvdlinechart.html',
		scope: {data: '=data',
						context: '=context'},
		link: function (scope, element, attrs) {

			var body = $document[0].body;

			//scaledynamic if set to true will scale the graph to the window size
			var scaleWindow = (attrs.scaledynamic && attrs.scaledynamic==true);
			//showcost if set will plot the cost series
			var showCost = (attrs.showcost && attrs.showcost==true);

			//hide bottom axis?
			var hideBottomXAxis = (attrs.hidebottomaxis && attrs.hidebottomaxis==true)?true:false;
			var hideTopXAxis = (attrs.hidetopaxis && attrs.hidetopaxis==true)?true:false;

			var windowOriginalState = {
				h: $window.innerHeight,
				w: $window.innerWidth
			};
			var windowLastState = $.extend(true,[],windowOriginalState);
			var elementMinimum = {
				h: 50,
				w: 100
			};
			var margin = {
				top: (hideTopXAxis)?5:20,
				right: 80,
				bottom: (hideBottomXAxis)?5:40,
				left: 60
			};


			//get (initial) element dimensions
			var elementWidth = getPixels(windowOriginalState.w,
								(attrs.width)? attrs.width:300, 300)
								- margin.left - margin.right;
			var elementHeight= getPixels(windowOriginalState.h,
								(attrs.height)? attrs.height:300, 300)
								- margin.top - margin.bottom;

			//create the svg element
			var el = d3.select(element[0]);
			var svg = el.append('svg')
				.attr('height', elementHeight + margin.top+margin.bottom)
				.attr('width', elementWidth + margin.left+margin.right)
				.style('border','1px solid #ddd')
				.style('padding','0');

			// create the canvas element
			var canvas = svg.append('g')
					.attr('transform','translate('+margin.left+','+margin.top+')');

			var elementOriginalState = {
				h: elementHeight,
				w: elementWidth
			}

			// declare scope variables
			var ms2day = 86400000; // num milliseconds to a day

			var x = d3.scaleLinear()
					.domain([0,30])
					.range([0, elementWidth]),
				y = d3.scaleLinear()
					.domain([0,100])
					.range([elementHeight,0]),
				y2 = d3.scaleLinear()
					.domain([0,100])
					.range([elementHeight,0]),
				xAxis = canvas.append('g').attr('id','xAxis')
						.attr('class','axis axis--x')
						.attr('transform','translate(0,'+ elementHeight +')')
						.call(d3.axisBottom(x).ticks(10)),
  			yAxisDepth = canvas.append('g').attr('id','yAxisDepth')
  					.attr('class','axis axis--y')
  					.call(d3.axisLeft(y).ticks(10));
  		var	lineDepth = d3.line()
  					.x(function(d) {
							return x(d.cumulativeduration / ms2day); })
  					.y(function(d) { return y(d.depth); });

			var hoverLine = canvas.append('g')
				.attr('class','hover-line')
				.append('line')
				.attr('x1',margin.left)
				.attr('y1',0)
				.attr('x2',margin.left)
				.attr('y2',elementHeight)
				.style('opacity',1);

			var focusDepth = svg.append('g')
				.attr('id','focusDepth');

			var focusCost = svg.append('g')
				.attr('id','focusCost');
				//.style('display','none')

    	if (hideBottomXAxis) xAxis.style('opacity','0');

  		var c = d3.scaleLinear()
  				.domain([0,100])
  				.range([elementHeight*0.2],0);

  		if (showCost) {
				//show cost series
  			var yAxisCost = canvas.append('g').attr('id','yAxis2')
  					.attr('class','axis axis--y')
  					.attr('transform','translate('+elementWidth+',0)')
  					.call(d3.axisRight(y2).ticks(10)),
  				lineCost = d3.line()
  					.x(function(d) {return x(d.cumulativeduration / ms2day);})
  					.y(function(d) {return y2(d.cost);});
  		}

			//console.log(scope.data);
    	var _data = [];
			var _dataNoDT = [];

			var bisectTime = d3.bisector(function(d) {return d.cumulativeduration;}).left;

			svg.on('mousemove', function() {
				var x_pix = d3.mouse(this)[0];
				var y_pix = d3.mouse(this)[1];
				x_focus = x.invert(x_pix-margin.left);
				y_focus = y.invert(y_pix-margin.top);
				if (!scope.context) {
					scope.context = {x:0,y:0};
				}
				scope.context['x'] = x_focus;
				scope.context['y'] = y_focus;
				scope.$apply(); //apply values to scope
			})
			.on('mouseover',function() {
				focusCost.style('display',null);
				focusDepth.style('display',null);
			})
			.on('mouseout',function() {
				focusCost.style('display','none');
				focusDepth.style('display','none');
			});


			var draw = function() {
				if (!_data || _data.length<1) return false;

				var _d = processDVDData(_data, _dataNoDT);
				_data = _d['data'];
				_dataNoDT = _d['dataNoDT'];

				var maxRop = d3.max(_data,function(d){return d.rop;});
				var meanRop = d3.mean(_data,function(d) {return d.rop;});
				var maxRop50pct = meanRop;

				x.range([0, elementWidth])
					.domain(d3.extent(_data,function (d){ return (d.cumulativeduration / ms2day)*1.02;}));

				y.range([elementHeight,0])
					.domain(d3.extent(_data, function(d) { return d.depth*1.02; }).reverse());

				xAxis
					.attr('transform','translate(0,'+ elementHeight +')')
					.call(d3.axisBottom(x).ticks((attrs.xtickcount)?attrs.xtickcount:8))
					.selectAll("text")
				        .style("text-anchor", "end")
				        .attr("dx", "-.8em")
				        .attr("dy", ".15em")
				        .attr("transform", "rotate(-35)");

				yAxisDepth
					.call(d3.axisLeft(y).ticks((attrs.ytickcount)?attrs.ytickcount:8));

				canvas.selectAll('#depthseries').remove();
				canvas.append('path')
					.attr('id', 'depthseries')
					.style('fill', 'none')
					.style('stroke',(attrs.depthcolor)?attrs.depthcolor:'green')
					.datum(_data)
					.attr('class','line')
					.attr('stroke-width','2')
					.attr('d',lineDepth);

				canvas.selectAll('#depthNoDTseries').remove();
					canvas.append('path')
						.attr('id', 'depthNoDTseries')
						.style('fill', 'none')
						.style('stroke','blue')
						.attr('stroke-dasharray','5,5')
						.style('opacity',0.5)
						.datum(_dataNoDT)
						.attr('class','line')
						.attr('d',lineDepth);

				// canvas.selectAll('#dot').remove();
				// canvas.selectAll('#dot')
				// 	.data(_data)
				// 		.enter().append('circle')
				// 			.attr('id','dot')
				// 			.style('fill', function(d) {
				// 				var _c = (attrs.depthcolor)?attrs.depthcolor:'blue';
				// 				if (d.rop <= maxRop50pct) {
				// 					_c = 'red';
				// 				}
				// 				return _c;
				// 			})
				// 			.style('opacity','0.35')
				// 			.attr('r','3')
				// 			.attr('cx', function(d) {return x(d.cumulativeduration / ms2day);})
				// 			.attr('cy', function(d) {return y(d.depth);})
				// 		.exit().remove();

				focusDepth.append('circle')
					.attr('class','focusDepth')
					.attr('cx',margin.left)
					.attr('cy',margin.top)
					.style('stroke',(attrs.depthcolor)?attrs.depthcolor:'green')
					.style('fill','none')
					.attr('r',4)
					// .append('rect')
					// .attr('x',50)
					// .attr('y',50)
					// .style('stroke','black')
					// .attr('height',5)
					// .attr('width',10)
					// .style('fill','red')
					// .append('text')
					// .text('hello')
					// .attr('dy','0.35em')
					// .attr('translate','transform(50,50)');

				if (showCost) {
					y2.range([elementHeight,0]);
					y2.domain(d3.extent(_data, function(d) {return d.cost * 1.02; }));

					canvas.selectAll('#costseries').remove();
					yAxisCost
						.attr('transform','translate('+elementWidth+',0)')
						.call(d3.axisRight(y2).ticks((attrs.ytickcount)?attrs.ytickcount:8))
						.selectAll('text')
						.style('fill',(attrs.costcolor)?attrs.costcolor:'red');
					canvas.append('path')
						.attr('id', 'costseries')
						.style('fill', 'none')
						.style('stroke',(attrs.costcolor)?attrs.costcolor:'red')
						.datum(_data)
						.attr('class','line')
						.attr('d',lineCost);
					focusCost.append('circle')
						.attr('class','focusCost')
						.attr('cx',margin.left)
						.attr('cy',margin.top)
						.style('stroke',(attrs.costcolor)?attrs.costcolor:'red')
						.style('fill','none')
						//.style('display','none')
						.attr('r',4);

				}

			}
			scope.$watch('data',
				function(newData, oldData) {
					_data = newData;
					draw();
					return true;
        }, true);

			scope.$watch('context', function(newData,oldData) {
				if (newData && newData['x']) {
					// returns day number from the X axis
					// translate day number to local chart's x axis
					var translatedX = x(newData['x']); // <-- translate it to the local chart's x axis
					// plot it
					hoverLine.attr('x1',translatedX).attr('x2',translatedX).style('opacity','1');

					//console.log(newData['x']*ms2day);
					var _i = bisectTime(_data, newData['x']*ms2day);
					if (_data[_i] && _data[_i]['duration']) {
						//console.log(y2(_data[_i].cost));
						var translatedY = y(_data[_i].depth);
						var translatedY2 = y2(_data[_i].cost);
						if (translatedX>0) {
							if (showCost) {
								focusCost.select('circle.focusCost')
									.attr('transform', 'translate('+
											translatedX +
											','+
											translatedY2 +
									')')
									.style('display',null);
							}
							focusDepth.select('circle.focusDepth')
								.attr('transform', 'translate('+
										translatedX +
										','+
										translatedY +
								')')
								.style('display',null);
						}

						//console.log(translatedX+','+translatedY);
					}
				}
				return true;
			},true);

			if (scaleWindow)
			angular.element($window).bind('resize', function() {
				var _resized = (($window.innerHeight != windowLastState.h) ||
					($window.innerWidth != windowLastState.w));

				if (_resized) {
					// get the new ratio
					var rHeight = $window.innerHeight / windowOriginalState.h;
					var rWidth = $window.innerWidth / windowOriginalState.w;
					var _w = Math.floor(elementOriginalState.w * rWidth);
					var _h = Math.floor(elementOriginalState.h * rHeight);
					elementWidth = ((_w < elementMinimum.w)? elementMinimum.w:_w);
					elementHeight = ((_h < elementMinimum.h)? elementMinimum.h:_h);

					svg
						.attr('height', elementHeight + margin.top + margin.bottom)
						.attr('width', elementWidth + margin.left + margin.right);

					windowLastState.h = $window.innerHeight;
					windowLastState.w = $window.innerWidth;
					draw();
				}
				scope.$digest();
			});
			draw(); // this will be called once the element has been initialised
		}
	}
	return directiveDefObj;

}]);

app.directive('cumulativechart',
	['$window', '$document', function($window, $document) {

	// Class Cumulative Chart

	var directiveDefObj = {
		restrict: 'E',
		templateUrl: '/templates/d3/dvdlinechart.html',
		scope: {data: '=data',
						context: '=context'},
		link: function (scope, element, attrs) {

			var body = $document[0].body;

			//scaledynamic if set to true will scale the graph to the window size
			var scaleWindow = (attrs.scaledynamic && attrs.scaledynamic==true);
			//showcost if set will plot the cost series
			var showCost = (attrs.showcost && attrs.showcost==true);

			//hide bottom axis?
			var hideBottomXAxis = (attrs.hidebottomaxis && attrs.hidebottomaxis==true)?true:false;
			var hideTopXAxis = (attrs.hidetopaxis && attrs.hidetopaxis==true)?true:false;

			var windowOriginalState = {
				h: $window.innerHeight,
				w: $window.innerWidth
			};
			var windowLastState = $.extend(true,[],windowOriginalState);
			var elementMinimum = {
				h: 50,
				w: 100
			};
			var margin = {
				top: (hideTopXAxis)?5:20,
				right: 80,
				bottom: (hideBottomXAxis)?5:40,
				left: 60
			};


			//get (initial) element dimensions
			var elementWidth = getPixels(windowOriginalState.w,
								(attrs.width)? attrs.width:300, 300)
								- margin.left - margin.right;
			var elementHeight= getPixels(windowOriginalState.h,
								(attrs.height)? attrs.height:300, 300)
								- margin.top - margin.bottom;

			//create the svg element
			var el = d3.select(element[0]);
			var svg = el.append('svg')
				.attr('height', elementHeight + margin.top+margin.bottom)
				.attr('width', elementWidth + margin.left+margin.right)
				.style('border','1px solid #ddd')
				.style('padding','0');

			// create the canvas element
			var canvas = svg.append('g')
					.attr('transform','translate('+margin.left+','+margin.top+')');



			var elementOriginalState = {
				h: elementHeight,
				w: elementWidth
			}

			// declare scope variables
			var ms2day = 86400000; // num milliseconds to a day

			var x = d3.scaleLinear()
					.domain([0,30])
					.range([0, elementWidth]),
				y = d3.scaleLinear()
					.domain([0,100])
					.range([elementHeight,0]),
				y2 = d3.scaleLinear()
					.domain([0,100])
					.range([elementHeight,0]),
				xAxis = canvas.append('g').attr('id','xAxis')
						.attr('class','axis axis--x')
						.attr('transform','translate(0,'+ elementHeight +')')
						.call(d3.axisBottom(x).ticks(10)),
  			yAxisDur = canvas.append('g').attr('id','yAxisDur')
  					.attr('class','axis axis--y')
  					.call(d3.axisLeft(y).ticks(10));
			var _lastY = 0;
			var y_focus=0,x_focus=0;
  		var	lineClass = d3.line()
  					.x(function(d) { return x(d.cumulativeduration / ms2day); })
  					.y(function(d) {
							if (d.class=='0') {
								_lastY = _lastY + (d.duration/ms2day);
								//d['cumulativeduration'] = _lastY;
							}
							return y(_lastY);
						});

			var hoverLine = canvas.append('g')
				.attr('class','hover-line')
				.append('line')
				.attr('x1',margin.left)
				.attr('y1',0)
				.attr('x2',margin.left)
				.attr('y2',elementHeight)
				.style('opacity',1);

    	if (hideBottomXAxis) xAxis.style('opacity','0');

  		// var c = d3.scaleLinear()
  		// 		.domain([0,100])
  		// 		.range([elementHeight*0.2],0);

			//console.log(scope.data);
    	var _data = [];
			var _dataNoDT = [];
			var bisectTime = d3.bisector(function(d) {return d.cumulativeduration;}).left;

			svg.on('mousemove', function() {
				var x_pix = d3.mouse(this)[0];
				var y_pix = d3.mouse(this)[1];
				x_focus = x.invert(x_pix-margin.left);
				y_focus = y.invert(y_pix-margin.top);
				if (!scope.context) {
					scope.context = {x:0,y:0};
				}
				scope.context['x'] = x_focus;
				scope.context['y'] = y_focus;
				scope.$apply(); //apply values to scope
			});


			var draw = function() {
				if (!_data || _data.length<1) return false;

				var _d = processDVDData(_data, _dataNoDT);
				_data = _d['data'];
				_dataNoDT = _d['dataNoDT'];
				_lastY = 0;
				//console.log(_data);
				var maxC = d3.sum(_data, function(d) {return d.class=='0'?d.duration:0;}) / ms2day;

				x.range([0, elementWidth])
					.domain(d3.extent(_data,function (d){ return (d.cumulativeduration / ms2day)*1.02;}));

				y.range([elementHeight,0])
					.domain([0,maxC]);
					//.domain(d3.extent(_data, function(d) { return d.depth*1.02; }).reverse());

				xAxis
					.attr('transform','translate(0,'+ elementHeight +')')
					.call(d3.axisBottom(x).ticks((attrs.xtickcount)?attrs.xtickcount:8))
					.selectAll("text")
				        .style("text-anchor", "end")
				        .attr("dx", "-.8em")
				        .attr("dy", ".15em")
				        .attr("transform", "rotate(-35)");


				yAxisDur
					.call(d3.axisLeft(y).ticks((attrs.ytickcount)?attrs.ytickcount:4));

				canvas.selectAll('#classseries').remove();

				canvas.append('path')
					.attr('id', 'classseries')
					.style('fill', 'none')
					.style('stroke',(attrs.depthcolor)?attrs.depthcolor:'red')
					.datum(_data)
					.attr('class','line')
					.attr('stroke-width','2')
					.attr('d',lineClass);

			}

			scope.$watch('data',
				function(newData, oldData) {
					_data = newData;
					draw();
					return true;
        }, true);

			scope.$watch('context', function(newData,oldData) {
				if (newData && newData['x']) {
					// returns day number from the X axis
					// translate day number to local chart's x axis
					var translatedX = x(newData['x']); // <-- translate it to the local chart's x axis
					// plot it
					hoverLine.attr('x1',translatedX).attr('x2',translatedX).style('opacity','1');

					//console.log(newData['x']*ms2day);
					var _y = bisectTime(_data, newData['x']*ms2day);
					if (_data[_y] && _data[_y]['duration']) {
						//console.log(_data[_y]);
					}
				}
				return true;
			},true);

			if (scaleWindow)
			angular.element($window).bind('resize', function() {
				var _resized = (($window.innerHeight != windowLastState.h) ||
					($window.innerWidth != windowLastState.w));

				if (_resized) {
					// get the new ratio
					var rHeight = $window.innerHeight / windowOriginalState.h;
					var rWidth = $window.innerWidth / windowOriginalState.w;
					var _w = Math.floor(elementOriginalState.w * rWidth);
					var _h = Math.floor(elementOriginalState.h * rHeight);
					elementWidth = ((_w < elementMinimum.w)? elementMinimum.w:_w);
					elementHeight = ((_h < elementMinimum.h)? elementMinimum.h:_h);

					svg
						.attr('height', elementHeight + margin.top + margin.bottom)
						.attr('width', elementWidth + margin.left + margin.right);

					windowLastState.h = $window.innerHeight;
					windowLastState.w = $window.innerWidth;
					draw();
				}
				scope.$digest();
			});
			draw(); // this will be called once the element has been initialised
		}
	}
	return directiveDefObj;

}]);
