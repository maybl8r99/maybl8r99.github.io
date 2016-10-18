/*
	Author: Reuben Wee
	Date:	19 September 2016

	requires
	* jquery
	* d3js v4

	To Do:

	* programmatic zooming - pass Y values From and To and zoom to that extent.
		Set those values in scope.$watch 'properties'.zoomFrom 'properties'.zoomTo
	* "tooltip" on all intersected series (with hoverLine)
	* stacked series - combining different series in a single lane
	* Survey 3D rotation

	Done:
	* Zoom Y (Depth) Axis

	* HoverLine - 2016-09-19


	Known issues

	* Left zoom/pan and Right zoom/pan stores different values - redraws on each update.
*/

app.directive('welllog',
	['$window', function($window) {

	// Well log chart

	var directiveDefObj = {
		restrict: 'E',
		//templateUrl: '/templates/d3/welllog.html',
		template: '',
		scope: {data: '=data',
				context: '=context',
				properties: '=properties'},
		link: function (scope, element, attrs) {

// ****** Initial Settings
			var windowOriginalState = {
				h: $window.innerHeight,
				w: $window.innerWidth
			};
			var maxSeries = 8;
			var windowLastState = $.extend(true,[],windowOriginalState);
			var elementMinimum = { // the minimum dimension of the element
				h: 50,
				w: 100
			};
			var margin = {
				top: (hideTopXAxis)?5:50,
				right: 40,
				bottom: (hideBottomXAxis)?5:40,
				left: 40
			};

// ****** Configuration from parameters
			//hide bottom axis?
			var hideBottomXAxis = (attrs.hidebottomaxis && attrs.hidebottomaxis==true)?true:false;
			var hideTopXAxis = (attrs.hidetopaxis && attrs.hidetopaxis==true)?true:false;
			//scaledynamic if set to true will scale the graph to the window size
			var scaleWindow = (attrs.scaledynamic && attrs.scaledynamic==true);
			var plotHeatMap = (attrs.plotheatmap && attrs.plotheatmap ==true);
			//showcost if set will plot the cost series
			var showCost = (attrs.showcost && attrs.showcost==true);
			var windowDim = function() {
				return {
					h : getPixels(windowOriginalState.h,
								(attrs.height)? attrs.height:300, 300)
								- margin.top - margin.bottom,
					w : getPixels(windowOriginalState.w,
								(attrs.width)? attrs.width:300, 300)
								- margin.left - margin.right,
					}
				}

			var zoomFactor = 1;

			var elementWidth = windowDim().w;
			var elementHeight= windowDim().h;
			var totalHeaderHeight = 10;

// ****** Layout main SVG framework 
			var el = d3.select(element[0]);
			var svg = el.append('svg')
				.attr('height', elementHeight + margin.top+margin.bottom)
				.attr('width', elementWidth + margin.left+margin.right)
				.style('border','1 solid #000')
				.style('padding','0');

			var elementOriginalState = {		// element initial size - used for calculating element resizes
				h: elementHeight,
				w: elementWidth
			}
			var svgClipDefs = svg.append('defs');//.append('clipPath').attr('id','log-cp');
  			var groupCanvas = svg.append('g')
  				.attr('class','group-canvas');
			var svgControls = svg.append('g')
				.attr('id','svg-controls');

			var svgClipPath = svgClipDefs.append('clipPath').attr('id','clip-graph');
	  		var clipRect = svgClipPath.append('rect').attr('id','clip-rect')
	  			.attr('fill','none').attr('width',1).attr('height',1);
			var headlineBox = groupCanvas.append('g').attr('id','headlineBox');
			var contentBox = groupCanvas.append('g').attr('id','contentBox').attr('clip-path','url(#clip-graph)');
   			var headerBox = {width:0,height:50};

  			var laneWidth = 1;

			var initialYSet = false; // we only want to set Y domain once after we've received all the data

			var	y = d3.scaleLinear()							// y is the scaled coordinate
					.domain([10000,0])							//	 sets the data domain from 100..0 descending
					.range([getContentHeight()-5,0]),					// 	 sets the projection to element height descending
				sessionYScale = y.copy(),
				yAxis = d3.axisLeft(y).ticks(7),
				yAxisDepth = svgControls.append('g')					// yAxisDepth[L|R] plots the axis with the 
			 					.attr('id','yAxisDepthL')					// correct translation in the svg "world"
			  					.attr('class','axis axis--y')
			  					.attr('transform','translate('+
			  						margin.left+','+
			  						totalHeaderHeight+')')
			  					.call(yAxis),
				_mAML = yAxisDepth.append('g'),
				// _mAMR = yAxisDepth.right.append('g'),
  				mouseAxisMarker = {
  					y1  : 	_mAML, 
  					r1 	: 	_mAML.append('circle')
		  					.attr('class','axis-marker')
		  					.attr('dx',-2)
		  					.attr('dy',0)
		  					.attr('r',5),
		  			rect1: _mAML.append('rect')
		  					.attr('dx',-25)
		  					.attr('dy',-2)
		  					.attr('width',20)
		  					.attr('height',20)
		  					.attr('fill','blue')
		  					.attr('opacity',0),
		  			label1: _mAML.append('text')
		  					.attr('dx',-17)
		  					.attr('dy', 2)
		  					.style('font-size','10px')
		  					.style('z-index','9999999')//{"font-size":"7px","z-index":"999999"})
		  					.attr('text-anchor','middle')
		  					.attr('fill','#888')
		  					.text('N/A')	
 				};
			var focusDepth = svgControls.append('g')
				.attr('id','focusDepth');
			var _zoomRect = svgControls.append('g')
				.attr('class','zoom-controls');
			var _brushRect = svgControls.append('g')
				.attr('class', 'brush-controls');
 			var plotCanvas = groupCanvas.append('g')
 				.attr('clip-path','url(#clip-graph)');
 			var depthSelectBox = plotCanvas.append('g')
 				.attr('id','g-depth-select-box')
 				.append('rect')
 				.attr('id','depth-select-box').attr('x',margin.left+1)
  				.attr('y',elementHeight-getContentHeight())
 				.attr('width',elementWidth-4).attr('height',getContentHeight())
 				.attr('stroke','none').attr('fill','none').attr('display','none');

			// zoom controls are placed on the left and right axes.
			var zoomRect = _zoomRect.append('rect')
					.attr('class','zoom')
					.attr('id','zoom-control-y1')
					.attr('opacity',0)
					.attr('y',0)
					.attr('width', margin.left)
					.attr('height', getContentHeight());


			var brushY = d3.brushY()
				.extent([[0, 0], [elementWidth, getContentHeight()]])
				.on('brush', brushYMouseMoved)
				.on('end', brushYEnded);

    		var brushRect = _brushRect.append('g')
    			.attr('class','depth-brush')
    			.attr('transform','translate('+margin.left+','+totalHeaderHeight+')')
    			.on('mousemove',brushYMouseMoved)
    			.on('mouseout',brushMouseExit)
    			.on('dblclick',function() {processDepthSelection(null,null);scope.$apply();})
    			.call(brushY);



// ******* Process scope and attributes
  			// number of series to plot
	   		var $$data = [];
	   		var $$dataFiltered = [];
  			//var series = {};

  			var seriesToPlot = JSON.parse(attrs.series);
  


			var columns = {'series':{},'lane':{},'header':{},'plot':{},'numLanes':0,'headerRowCount':0, 'xaxis':{}};
  			var depthSelection = [0,0];
			var bisect = {
				'depth' 	: 	d3.bisector(function(d) { return d.depth*1; }).left
			}

// ******* Main code starts
  			function setScale(s) {
  				var _scale = d3.scaleLinear();
  				if (s && s == 'log') {
  					_scale = d3.scaleLog();
  				}
  				return _scale;
  			}


			var getContentHeight = function() {
				return elementHeight- totalHeaderHeight + margin.top+margin.bottom;// - (totalHeaderHeight+margin.bottom);
			}

			var initColumns = function() {
				initYAxis();
				var laneCount = 0;
				for (var key in seriesToPlot.cols) {
					laneCount++;
					columns.numLanes=laneCount;
					var o = seriesToPlot.cols[key];
					columns.lane[key]={'series':[]};
					for(var i=0; i< o.length;i++) {
						var ukey = key + '-' + o[i].trim();
						columns.lane[key]['series'].push(o[i]);
						columns.series[ukey] = {'lane':key};
						if (seriesToPlot['config'] && seriesToPlot['config'][o[i]]) {
							columns.series[ukey] = $.extend(true, columns.series[ukey],seriesToPlot['config'][o[i]]);
						}
					}
				}
				// find number of row of headers to plot
				var numRows = 1;
				for (var key in columns.lane) {
					var o = columns.lane[key]['series'];
					if (o.length>numRows) numRows = o.length;
				}
				columns.headerRowCount = numRows;
				
				var lane = 0;
				laneWidth = Math.floor((elementWidth) / columns.numLanes);
				headerBox.width = laneWidth;
				totalHeaderHeight = Math.floor(headerBox.height * columns.headerRowCount);

				for (var key in columns.lane) {
					columns.header['header-'+key] = headlineBox.append('g').attr('id','header-lane-'+key);
					var _series = columns.lane[key];
					var contentLane = contentBox.append('g').attr('id','lane-'+key)
						.attr('transform','translate('+((lane*laneWidth)+margin.left)+','+totalHeaderHeight+')');
					var laneBox = contentLane.append('rect').attr('id','lanebox-'+key)
						.attr('width',laneWidth).attr('height',getContentHeight())
						.attr('class','log-'+(lane%2==0?'even':'odd')+'-background');
					for (var i=0; i< _series.series.length ;i++) {
						var seriesName = _series.series[i];
						var seriesKey = key+'-'+seriesName;
						columns.series[seriesKey]['xField'] = seriesName;
						columns.series[seriesKey]['yField'] = 'depth';

						columns.header['titlebox-'+seriesKey] = columns.header['header-'+key].append('g')
							.attr('id','titlebox-'+seriesKey);
						columns.header['titlebox-'+seriesKey].append('g').attr('id','heatgroup-'+seriesKey);
						var a1 = columns.header['titlebox-'+seriesKey];
						// add rectangle
						a1.append('rect')
							.attr('id','log-title-box-'+seriesKey).attr('class','log-titlebox-'+seriesName)
							.attr('height',headerBox.height).attr('width',laneWidth);

						var title = seriesName.toUpperCase();
						
						if (columns.series[seriesKey]['title']) title = columns.series[seriesKey]['title'].toUpperCase();

						a1.append('text')
							.attr('id','title-'+seriesKey).attr('dx', Math.floor(laneWidth/2))
							.attr('dy', 20).attr('text-anchor','middle').attr('fill','black')
							.text(title);

						var xAxis = initXAxis(seriesName,seriesKey);
						columns.series[seriesKey]['xAxis'] = xAxis;

						a1.append('g')
							.attr('id', 'axis-'+seriesKey).attr('class','axis axis--x')
							.attr('transform','translate(0,'+(headerBox.height-7)+')')
							.call(xAxis);

						a1.append('circle')
							.attr('id','axis-marker-'+seriesKey).attr('class','axis-marker').attr('fill','red')
							.attr('opacity',0.8).attr('r',3).attr('display','none')
							.attr('transform','translate(0,'+(headerBox.height-7)+')');

						var _brushX = d3.brushX()
							.extent([[0,0],[laneWidth,20]])
							.on('brush', brushXMouseMoved)
							.on('end',brushXEnded)

						a1.append('g').attr('id','filter-'+seriesKey).attr('class','filter-box')
							.attr('width',laneWidth).attr('height',25)
							.attr('series',seriesName).attr('serieskey',seriesKey).attr('lane',key)
							.attr('transform','translate(0,'+(headerBox.height-25)+')').call(_brushX);

						var seriesG = contentLane.append('g').attr('id','series-'+seriesKey);

						// plot columns
						//var seriesG = contentLane.select('#series-'+seriesKey);

					}
					lane++;
				}
				contentBox.append('rect')
					.attr('width', elementWidth).attr('height', getContentHeight())
					.attr('stroke','1px black').attr('fill','none')
					.attr('transform','translate('+margin.left+','+totalHeaderHeight+')');
				svg.select('#clip-rect').attr('width',elementWidth).attr('height',getContentHeight())
					.attr('transform','translate('+margin.left+','+totalHeaderHeight+')')
			}
			initColumns();


			function renderColumns() {
				var i = 0;
				initYAxis();
				var totalHeight = columns.headerRowCount * headerBox.height;
				laneWidth = Math.floor((elementWidth) / columns.numLanes);
				clipRect.attr('width',elementWidth);
				depthSelectBox.attr('width',elementWidth);
				for (var key in columns.lane) {

					//reposition groups
					groupCanvas.selectAll('#header-lane-'+key)
						.attr('width',laneWidth)
						.attr('transform','translate('+ ((laneWidth*i)+margin.left) +',0)');
					groupCanvas.selectAll('#lane-'+key)
						.attr('width',laneWidth)
						.attr('transform','translate('+ ((laneWidth*i)+margin.left) +','+totalHeaderHeight+')');
					groupCanvas.selectAll('#lanebox-'+key)
					 	.attr('width',laneWidth)
					 	.attr('height',getContentHeight());

					i++;
					var _series = columns.lane[key];
					var contentLane = groupCanvas.select('#lane-'+key);
					//console.log('#lane-'+key);
					var rowCount = 1;
					for (var c=0;c< _series.series.length;c++) {
						var seriesName = _series.series[c];
						var seriesKey = key+'-'+seriesName;
						var xAxis = columns.series[seriesKey]['xAxis'];

						var offset = headerBox.height * rowCount;

						// arrange the title boxes on top of the content
						groupCanvas.select('#titlebox-'+seriesKey)
							.attr('transform','translate(0,'+ (totalHeight-offset)+')')
							.attr('width',laneWidth);



						groupCanvas.select('#log-title-box-'+seriesKey)
							.attr('width',laneWidth);

						groupCanvas.select('#title-'+seriesKey)
							.attr('dx',Math.floor(laneWidth/2));

						var scale = columns.series[seriesKey]['scale']?
											columns.series[seriesKey]['scale']
											:'lin';
						var xAxis = initXAxis(seriesName,seriesKey);
						columns.series[seriesKey]['xAxis'] = xAxis;
						var axis = groupCanvas.select('#axis-'+seriesKey)
							.call(xAxis);

						// plot columns
						var seriesG = contentLane.select('#series-'+seriesKey);
						seriesG.select('#path-'+seriesKey).remove();
						var seriesL = seriesG.append('path')
										.attr('class','log-'+seriesName).attr('id','path-'+seriesKey).style('fill','none')
										.attr('vector-effect','non-scaling-stroke') // stroke width immune to scaling
										.style('stroke-width','1px').datum($$data).attr('d',plotChart(seriesKey));
						plotSeriesIntersect(key,seriesKey);
						rowCount++;
					}
				}
    			brushRect.attr('transform','translate('+margin.left+','+totalHeaderHeight+')');
				if (plotHeatMap) heatMapAxis();
			}
			renderColumns();

			function initXAxis(seriesName,seriesKey) {
				var d = [0,30];
				var scale = columns.series[seriesKey]['scale']?columns.series[seriesKey]['scale']:'lin';
				if ($$data) {
					d = d3.extent($$data,function(d) {
							return ((d[seriesName]*1))
						});
				}
				columns.series[seriesKey]['xDomain'] = d;
				var xScale = setScale(scale).clamp(true).domain(d).range([0,laneWidth]);
				columns.series[seriesKey]['xScale'] = xScale;
				var xAxis = d3.axisTop(xScale).ticks(4);
				if (scale == 'log') xAxis = d3.axisTop(xScale).ticks(4,'.2');
				return xAxis;
			}

			function initYAxis() {
				if ($$data) {
					var extent = d3.extent($$data, function(d) {return d.depth*1}).reverse();
					y.domain(extent);
				}
				y.range([getContentHeight(),0]);
				if (!initialYSet) {
					sessionYScale = y.copy();
					initialYSet = true;
				}
				
				yAxis = d3.axisLeft(sessionYScale).ticks(7);
				yAxisDepth
					.attr('transform','translate('+margin.left+','+totalHeaderHeight+')')
					.attr('height',getContentHeight())
					.call(yAxis);
				zoomRect
					.attr('transform','translate(0,'+totalHeaderHeight+')')
					.attr('height',getContentHeight());
				svgControls.select('.depth-brush')
					.attr('width', elementWidth-margin.right)
					.attr('height',getContentHeight())
					.call(brushY);

			}

			function plotChart(seriesKey){
				if (!$$data) return null;
				var xAxis = columns.series[seriesKey]['xAxis'];
				var xScale = columns.series[seriesKey]['xScale'];
				var xField = columns.series[seriesKey]['xField'];
				var yField = columns.series[seriesKey]['yField'];
				var line = d3.line().curve(d3.curveStep)
					.x(function(d) {return xScale(d[xField]);})
					.y(function(d) {return sessionYScale(d[yField]);});
				columns.series[seriesKey]['path'] = line;
				return line;
			}


			function getContentHeight() {
				return elementHeight - totalHeaderHeight;
			}

			function draw() {
				if (!$$data||$$data.length<1) return false;

				// TODO verify series
				// seriestoplot may have extra fields which $$data do not carry
				// check and prune  

				if (!initialYSet) {
					y.domain(d3.extent($$data, function(d) { return d.depth*1; }).reverse());
					sessionYScale = y.copy();
					initialYSet = true;
				}
				renderColumns();
 				setDepthSelect(depthSelection[0],depthSelection[1]);
			}

// ****** Events et al.
			var zoom = d3.zoom() 
			    .scaleExtent([1, 50]) // minimum zoom is x1 maximum is x50
			    .translateExtent([[0, 0], [0, getContentHeight() + 100]])
			    .on('zoom', zoomed);

			function zoomed() {
				var _transform = d3.event.transform;
				_transform.x = 1;
				sessionYScale = _transform.rescaleY(y);

				yAxis.scale(sessionYScale);

				var [depthMin,depthMax] = sessionYScale.domain();
						
				processDepthSelection(depthMin,depthMax);
				scope.$apply();
				//draw();
			}

			zoomRect.call(zoom);

			function panned() {
				var dy = d3.event.wheelDeltaY;
				console.log('dy',dy);
			}

			function brushYMouseMoved() {
				svg.selectAll('.axis-marker').attr('display','');

				// get the Depth from Y
				var y_pix = d3.mouse(this)[1];
				var d= 'N/A';
				if ($$data && $$data.length>0) {
					var i = bisect.depth($$data,sessionYScale.invert(y_pix));
					o = $$data[i];
					if (o) {
						d = o.depth || 'N/A';// (o['depth'])? o['depth']:'N/A';
						updateXMarkers(o,d3.mouse(this)[0]);						
					}
				}

				mouseAxisMarker['y1'].attr('transform','translate(0,'+y_pix+')'); 
				//mouseAxisMarker['y2'].attr('transform','translate(0,'+y_pix+')'); 
				mouseAxisMarker['label1'].text(d);
				//mouseAxisMarker['label2'].text(d);				
			}

			function brushXMouseMoved() {
				var series = d3.select(this).attr('series'); // takes the series attribute from the element.
				//not much to do here yet.
			}

			function updateXMarkers(d,x) { // get series value given depth
				if (!columns.series) return;
				var allseries = columns.series;
				for (var key in allseries) {
					var obj = allseries[key];
					var f = obj['xField'];

					var elementId = 'axis-marker-'+key;
					var x = obj['xScale'](d[f]);

					groupCanvas.select('#'+elementId)
						//.transition().duration(100)
						.attr('transform','translate('+x+','+(headerBox.height-7)+')');
				}
			}

			function brushMouseExit() {
				svg.selectAll('.axis-marker').attr('display','none');
			}

			function brushXEnded() {
				var depthMin = false, depthMax = false;
				if (scope.context && scope.context['depthSelection']) {
					[depthMin,depthMax] = scope.context['depthSelection'];
				}
				if (depthMin==depthMax) depthMin=false,depthMax=false;

				var series = d3.select(this).attr('series'); // takes the series attribute from the element.
				var sk = d3.select(this).attr('serieskey');
				var lane = d3.select(this).attr('lane');
				var sl = d3.event.selection;
				var obj = columns['series'][sk];
				columns['series'][sk]['intersectData']=null;
				if (sl!=null) {
					var [min,max] = sl;
					var f = obj['xField'];
					var scale = obj['xScale'];
					var imin = scale.invert(min), imax = scale.invert(max);
					var _$$data = $$data.filter(function(d) {
						var truth = false;
						if (depthMin != false) {
							truth = (d['depth'] >= depthMin && d['depth'] <= depthMax) &&
									(d[f] >= imin && d[f] <= imax);
						} else {
							truth = (d[f] >= imin && d[f] <= imax);
						}
						return truth;
					})
					columns['series'][sk]['intersectData'] = _$$data;					
				}
				plotSeriesIntersect(lane,sk)
				draw();
			}

			function plotSeriesIntersect(lane,sk) {
				var obj = columns['series'][sk];
				var f = obj['xField'];
				var intersectData = obj['intersectData'];
				var laneId = 'lane-'+lane;
				var plots = groupCanvas.select('#'+laneId);
				var scale = obj['xScale'];
				plots.selectAll('.filterPlot-'+sk).remove();
				if (intersectData && intersectData.length>0) {
					plots.selectAll('.filterPlot-'+sk)
						.data(intersectData).enter()
						.append('circle').attr('class','filterPlot-'+sk+' log-titlebox-'+f).attr('r',5)
						.attr('opacity',0.1).attr('stroke','1px solid black')
						.attr('cy', function(d){return sessionYScale(d['depth']);})
						.attr('cx', function(d){return scale(d[f]);});							
				}
			}

			function brushYEnded() {
				var s = d3.event.selection;
				if ($$data && $$data.length>0) {
					if (s && s.length == 2) {
						var yMin = sessionYScale.invert(s[0]);
						var yMax = sessionYScale.invert(s[1]);
						processDepthSelection(yMin,yMax);
						scope.$apply();
					}
				}
			}

 			function setDepthSelect(minDepth,maxDepth) {
 				drawDepthSelect(sessionYScale(minDepth),sessionYScale(maxDepth));
  			}

 			function drawDepthSelect(min,max) {
 				// min & max is actual Y coordinates 
 				if (!$$data) return;
 				var _rect = groupCanvas.select('#depth-select-box');
 				if (max<min) max = min;
 				 _rect
 					.attr('y',min).attr('height',max-min).attr('width',elementWidth-2)
 					.attr('display','').attr('opacity',1).attr('transform','translate(0,'+totalHeaderHeight+')')
 					.on('dblclick',function() {processDepthSelection(0,0);scope.$apply();}); 				
 			}

 			function heatMapAxis() {
 				// currently very slow as we are going through each data point directly with bisector
 				// and creating individual elements on the svg DOM
 				// faster and more efficient way is probably here -> http://bl.ocks.org/kiranml1/6972900
 				// limiting data points to under 500
 				if (!$$data || $$data.length < 1) return false;
 				var [min,max] = depthSelection;
 				var allseries = columns.series;
 				groupCanvas.selectAll('.heatbox').remove();
				var imin = bisect.depth($$data,min);
				var imax = bisect.depth($$data,max);
				var _$$data = $$data.filter(function(d) { // get all data that intersects
					return (d['depth']>= min && d['depth']<=max);
				});
				//console.log('min',min,'max',max,'count',_$$data.length,'ds',depthSelection);
				if (_$$data.length >= 500) {
					console.log('data count too high for heat map');
					return false;
				}
				for (var key in allseries) {
					var obj = allseries[key];
					var f = obj['xField'];
					var tb = groupCanvas.select('#heatgroup-'+key);
					var xScale = obj['xScale'];
					var hb = groupCanvas.select('#heatgroup-'+key);
					hb.selectAll('.heatbox').remove();
					hb.selectAll('.heatbox')
						.data(_$$data).enter()
						.append('circle').attr('class','heatbox log-titlebox-'+f).attr('r',5)
						.attr('opacity',0.3).attr('cy',(headerBox.height-7))
						.attr('cx',function(d) {return obj['xScale'](d[f]);}); //obj['xScale'](d[f])
				}
 			}

			function processDepthSelection(min,max) {
				if (!$$data) return;
				var _min = (max < min)? max:min;
				var _max = (max > min)? max:min;
				if (_min==_max) [_max,_min] = y.domain();
				depthSelection = [Math.floor(_min),Math.floor(_max)];
				sessionYScale.domain([_max,_min]);
				yAxis = d3.axisLeft(sessionYScale).ticks(7);
				yAxisDepth.call(yAxis);
				d3.selectAll(".depth-brush").call(brushY.move,null);
				if (!scope['context']) scope.context = {};
				scope.context['depthSelection'] = depthSelection;	
				draw();
				drawDepthSelect(sessionYScale(_min),sessionYScale(_max));
			}

			scope.$watch('data',
				function(newData, oldData) {
					$$data = newData;
					initialYSet = false; // allow domain calculations again
					//renderColumns();
					draw();
					return true;
        	}, true);

        	scope.$watch('properties',
        		function(newData, oldData) {
        			if (newData && newData['zoom'] ) zoomFactor = parseInt(newData['zoom']);
        			//console.log('watch properties');
        			draw();
        		}, true);

			scope.$watch('context', function(newData,oldData) {
				if ($$data && $$data.length>0) {
					if (newData['depthSelection']) {
						var _dR = newData['depthSelection'];
						if (_dR[1] < _dR[0]) _dR[0] = _dR[1];
						if (_dR[1] != _dR[0]) {
							processDepthSelection(_dR[0], _dR[1]);
							//draw();
						}
					}
				}
				if (newData && newData['depth'] && 
					($$data && $$data.length>0)) {
					draw();
				}
				return true;
			},true);

			if (scaleWindow){
				var resizeId;
				angular.element($window).bind('resize', function() {
					clearTimeout(resizeId);
					resizeId = setTimeout(resized,500);
				});
			}

			function resized() {
				var _resized = (($window.innerHeight != windowLastState.h) ||
					($window.innerWidth != windowLastState.w));

				if (_resized) {
					// get the new ratio
					var _w = Math.floor(elementOriginalState.w * ($window.innerWidth / windowOriginalState.w));
					var _h = Math.floor(elementOriginalState.h * ($window.innerHeight / windowOriginalState.h));
					elementWidth = ((_w < elementMinimum.w)? elementMinimum.w:_w);
					elementHeight = ((_h < elementMinimum.h)? elementMinimum.h:_h);

					svg.attr('height',elementHeight+margin.top+margin.bottom).attr('width',elementWidth+margin.left+margin.right);

					windowLastState.h = $window.innerHeight;
					windowLastState.w = $window.innerWidth;
					//renderColumns();
					draw();
				}
				scope.$digest();
			}
			draw(); // this will be called once the element has been initialised
		}
	}
	return directiveDefObj;

}]);