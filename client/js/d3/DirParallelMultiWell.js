// http://bl.ocks.org/mbostock/7586334
// http://bl.ocks.org/syntagmatic/2556042
// well log - multi-well parallel 


app.directive('parallelmultiwell',
	['$window', function($window) {

	var directiveDefObj = {
		restrict: 'E',
		templateUrl: '/templates/d3/DirParallelMultiWell.html',
		scope: {data: '=data',
				filter: '=filter',
				//testvar: '=testvar',
				events : '=events',
				wellList : '=wellList',
				context: '=context',
				properties: '=properties'},
		link: function (scope, element, attrs) {
			/*
				1.		Initialize
				1.1		Configure Axis
				1.1.1	X axis
						|---------|---------|----------|---------|
						each Tick on the X axis represents a dimension on the graph. Each
						dimension is represented as a Y axis on top of the X axis
				1.1.2	Y axis
						Each dimension is represented by a Y axis. The domain of the Y axis is defined
						by the field name. The field name is mentioned in two places;

						1) Element configuration under the "series" attribute JSON configuration tag 
						   "dimensions"
				2. Load data
						Currently loading from a static url /data/multi-well.csv . Data contains 3 wells
						generated from first well with jittering of datapoints to create uniqueness. 
				2.1		Prepare the axis.
				3. Plot
			*/


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
				right: 20,
				bottom: (hideBottomXAxis)?5:40,
				left: 80
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
			var header = {
					h : 50,
					w : windowDim().w
				},
				footer = {
					h : 50,
					w : windowDim().w
				},
				body = {
					h : windowDim().h - header.h - footer.h,
					w : windowDim().w
				}

		// *** layout
			var svg = d3.select('svg');
			var svgHeader = d3.select('#header-section');
			var svgFooter = d3.select('#footer-section');
			var svgBody = d3.selectAll('#body-section');
			//var svgXAxis = svgBody.append('g').attr('id','x-axis');
			//var svgDimensions = svgBody.select('#dimensions');
			//var svgDTemplate = svgDimensions.select('#dimention-template');
			var seriesToPlot = JSON.parse(attrs.series);
			var seriesConfig = seriesToPlot.config;
			var $$data = [];
			var $$dataFiltered = [];
			var $$dataFilterBuffer = {};
			var $$dimensions = {
				datalist: 	[],
				columns	: 	[],
				controls: 	{},
				svg 	: 	{},
				filters	: 	{}
			};
			var colour = d3.scaleOrdinal(d3.schemeCategory10);

			var x = d3.scalePoint();
			var yAxis = d3.axisLeft();
			var line = d3.line();

			var hollywood=null;
			var range = {min:0,max:0};
			var startWatch = false;

			init();
			resizeElements();
			//run();
			//console.log(data);

			//svgBody.style('display','none');

			function init() {
				var dimensions = {};
				$$dimensions['columns'] = seriesToPlot.dimensions;
				for (var d in $$dimensions['columns']) {
					var key = $$dimensions['columns'][d];
					var scale = d3.scaleLinear();
					dimensions[key] = {};
					if (seriesConfig[key]) {
						var sc = seriesConfig[key];
						switch (sc.scale) {
							case 'ordinal':
								scale = d3.scalePoint();
								break;
							case 'log':
								scale = d3.scaleLog();
								break;
						}
					}
					dimensions[key] = scale;
				}
				$$dimensions['controls'] = dimensions;
				scope.context['dimensionOrder'] = seriesToPlot['dimensions'];
				
			}

			function resizeElements() {
				//console.log(elementWidth,elementHeight);
				svg.attr('width',elementWidth).attr('height',elementHeight);
				svgHeader.select('rect').attr('height', header.h);
				svgBody.attr('height',elementHeight-header.h-footer.h);
				svgFooter.attr('transform','translate(0,'+(elementHeight-header.h)+')');
				svgFooter.select('rect').attr('height', footer.h);

				// spread columns.

			}

			function initDimensions() {
				var dimArray = [];
				var c = {};
				var wellList = [];
				var listOfDimensions = $$dimensions.columns;
				//for (var k in $$dimensions.controls) {
				//scope.context['dimensionOrder'] = seriesToPlot['dimensions'];
				for (var _ in listOfDimensions) {
					var k = listOfDimensions[_];
					var scale = $$dimensions.controls[k];
					var extent = null;
					var sc = seriesConfig[k] || null;
					//console.log('sc',sc);
					if (sc && sc.scale && sc.scale=='ordinal') {
						var allvalues = [];
						$$data.filter(function(d) {
							if (allvalues.indexOf(d[k]) < 0) allvalues.push(d[k]);
							if (k=='wellname') {
								if (wellList.indexOf(d[k])<0) wellList.push(d[k]);
							}
						});
						scale.range([0,elementHeight-margin.top-margin.bottom]);
						extent = allvalues;
					} else {
						extent = d3.extent($$data, function(d) {
							if (isNaN(d[k])) return d[k];
							return +d[k];
						});
					}
					scale.domain(extent);
					$$dimensions.controls[k] = scale;
					dimArray.push(k);
				}

				x.domain(dimArray);
				x.range([0, elementWidth-margin.left-margin.right]);

				var w = elementWidth / $$dimensions.columns.length;
				svgBody.select('alldimensions').remove();
				svgBody.selectAll('.axis').remove();
				var allDimensions = svgBody.select('#foreground').append('g').attr('id','alldimensions')
					.attr('transform','translate(0,'+margin.top+')');
				allDimensions.selectAll('.dimension').remove();
				var g = allDimensions.selectAll('.dimension')
					.data(dimArray)
					.enter().append('g').attr('class','dimension')
					.attr('id',function(d) {
						return 'dim-'+d;
					})
					.attr('dimension-name',function(d) {return d;})
					.attr('transform',function(d,i){
						return 'translate('+(x(d)+margin.left)+')';
					});

				g.append('g')
					.attr('class','axis')
					.each(function(d) {
						$$dimensions.controls[d].range([0,elementHeight-margin.top-margin.bottom]);
						var yX = d3.axisLeft($$dimensions.controls[d]).ticks(10);
						if (seriesConfig[d] && seriesConfig[d]['scale']) {
							if (seriesConfig[d]['scale']=='log') yX.ticks(10,'.2');
						}
						d3.select(this).call(yX);
					})
					.append('text').attr('id',function(d){return 'label-'+d;})
					.attr('dimension-name',function(d){return d;})
					.style('text-anchor', 'middle').style('fill','black').attr('y', -10)
					.text(function(d) {
						var label = d;
						if (seriesConfig[d] && seriesConfig[d]['label']) {
							label = seriesConfig[d]['label'];
						}
						return label.toUpperCase();
					});
      			g.append('g')
      				.attr('class','filter-boxes')
      				.append('rect').attr('id',function(d) {return 'filter-box-'+d;})
      					.attr('y',function(d) {return $$dimensions.controls[d]($$dimensions.controls[d].domain()[0]);})
      					.attr('x',function(d){return -8;})
      					.attr('width',16).attr('height',5)
      					.style('stroke','red').style('fill','none').style('display','none');

 
      			for(var d in seriesConfig) {
      				if (seriesConfig[d]['animate']) {
      					var _e = g.select('#label-'+d);
      					_e.style('cursor','copy')
      						.style('fill','red')
      						.on('click', animate)
      						.on('dblclick',resetFilter);
      				}
      			}
				var _brush = svgBody.selectAll('.dimension').append('g')
					.attr('class','brush')
					.each(function(d) {
						//console.log(d);
						var b = d3.select(this);
						b.attr('dimension-name',d);
						b.call(
							$$dimensions.controls[d]['brush'] = d3.brushY()
							.extent([[-8, 0], [8, elementHeight-margin.top-margin.bottom]])
							.on('start',brushstart)
							.on('end',brushend));
					})
					.selectAll('rect').attr('x',-8)
						.attr('width',16);
			}

			function drawFiltered() {
				console.time('drawfiltered');
				svgBody.select('#data-filtered').remove();
				var midground = svgBody.select('#midground').append('g')
					.attr('id','data-filtered')
					.selectAll('path')
					.data($$dataFiltered)
					.enter().append('path')
					.attr('fill','none')
					.attr('stroke',function(d) {return colour(d['wellname']);})
					.attr('opacity',function(d) {
						var o = 0.05;
						if ($$dataFiltered.length < 500) o=0.5;
						return o;
					})
					.attr('d', path)
					.exit().remove();

				console.timeEnd('drawfiltered');
				scope['context']['dataLength'] = $$data.length;
				scope['context']['dataFilteredLength'] = $$dataFiltered.length;
				
			}

			function draw() {
				// var background = svgBody.select('#background').append('g')
				// 	.selectAll('path')
				// 	.attr('stroke','black')
				// 	.data($$data)
				// 	.enter().append('path')
				// 	.attr('fill','none')
				// 	.attr('stroke','#ccc')
				// 	.attr('opacity',0.05)
				// 	.attr('d', path);
				//drawFiltered();
				//console.log($$dimensions);
			}

			function path(d) {
				return line($$dimensions.columns.map(function(p) {
					return [x(p)+margin.left,$$dimensions.controls[p](d[p])+margin.top];
				}));
			}

			function run() {
				startWatch = false;
				$$data = scope.data;
				$$dataFiltered = $$data;
				$$dimensions['datalist'] = [];
				var columns = scope.context['columns'];
				for (var i in columns) {
					$$dimensions['datalist'].push(columns[i]);
					var _i = $$dimensions['columns'].indexOf(columns[i].toLowerCase());
					if (_i>=0) {
						$$dimensions['columns'][_i] = columns[i];
					}
				}
				x.domain($$dimensions['controls']);
				initDimensions();
				draw();
				//console.log($$dimensions);
				startWatch = true;
			}

			function filterData() {
				$$dataFiltered = $$data;
				var filterbox = null;
				//console.log('filter',$$dimensions.filters);
				for (var f in $$dimensions.filters) {
					$$dataFiltered = $$dataFiltered.filter(function(d) {
						var filter = $$dimensions.filters[f];
						var b = false;
						if (filter['ordinal']) {
							b = (filter.ordinal.indexOf(d[f]) >= 0);//(d[f] == filter.min || d[f] == filter.max);
						} else {
							b = (d[f] >= filter.min && d[f] <= filter.max );
						} 
						return b;
					});
					filterbox = svgBody.select('#filter-box-'+f);
					filterbox.attr('y',$$dimensions.controls[f]($$dimensions.filters[f].min))
						.attr('height',$$dimensions.controls[f]($$dimensions.filters[f].max - $$dimensions.filters[f].min))
						.style('display','');
				}
				var dataLength = $$dataFiltered.length;
				var maxPoints = 2000;
				if (dataLength > maxPoints) {
					var $$dump = $.extend(true,[],$$dataFiltered);
					var pace = Math.floor(dataLength/maxPoints)+1;
					//console.log('pace',pace);
					//how do I reduce data down to 5000
					//console.log('NEED TO REDUCE THIS FURTHER');
				}
			}

			function resetFilter() {
				var dimension = d3.select(this).attr('dimension-name');
				if ('stop' in hollywood) {
					hollywood.stop();
					hollywood = null;
				}
				console.log(dimension);
				delete $$dimensions.filters[dimension];
				svgBody.select('#filter-box-'+dimension).style('display','none');
				filterData();
				drawFiltered();
			}

			function animate(dname) {
				var dimension;
				if (dname) {
					dimension = dname;
				} else {
					dimension = d3.select(this).attr('dimension-name');
				}
				if (!hollywood) {
					//console.log('lets dance', dimension);
					var _init = false;
					var domainMin = $$dimensions.controls[dimension].domain()[0];
					var domainMax = $$dimensions.controls[dimension].domain()[1];
					var step = 100;
					var thickness = 100;
					hollywood = d3.timer(function() {
						//var range = {min:0,max:0};
						//console.log('aaa',$$dimensions.controls[dimension].domain());
						if (!_init) {
							//var domain = $$dimensions.controls[dimension].domain()[1];
							step = domainMax / 200;
							//console.log('step',step);
							if ($$dimensions.filters[dimension]) {
								console.log('using existing range');
								range = $.extend(true,{},$$dimensions.filters[dimension]);
							} else {
								range.max=range.min+step;

							}
							thickness = range.max - range.min;
							//console.log('woot');
							_init=true;
						}
						range.min = range.min + (step/4);
						range.max = range.max + (step/4);
						if (range.max > domainMax) {
							range.min = domainMin;
							range.max = range.min + thickness;
						}
						//$$dimensions.controls[dimension].domain([range.min,range.max]);
						$$dimensions.filters[dimension] = range;
						//console.log($$dimensions.filters);
						filterData();
						drawFiltered();
						
						return true;
					}, 0);
				} else {
					console.log('simon says STOP');
					hollywood.stop();
					hollywood = null;
					//d3.intervalStop(null);
				}
			}
			function brushstart() {
				d3.event.sourceEvent.stopPropagation();
				//console.log('brushstarted');	
			}

			function brush() {
				d3.event.sourceEvent.stopPropagation();
				//console.log('brush moving');
			}
			function brushend() {
				d3.event.sourceEvent.stopPropagation();
				var sl = d3.event.selection;
				var dimension = d3.select(this).attr('dimension-name');
				$$dataFiltered = $$data;
				if (sl != null) {
					var cfg = seriesConfig[dimension] || null;
					var min = sl[0], max = sl[1];
					if (min==max) {
						delete $$dimensions.filters[dimension];
						var filterbox = svgBody.select('#filter-box-'+dimension).style('display','none');
					} else {
						if (cfg && cfg['scale'] && cfg['scale']=='ordinal') {
							var selected = $$dimensions.controls[dimension].domain().filter(function(d) {
								return (min <= $$dimensions.controls[dimension](d)) && ($$dimensions.controls[dimension](d)<= max);
							})
							$$dimensions.filters[dimension] = {'ordinal':selected};
							console.log(sl,min,max,selected);
						} else {
							min = $$dimensions.controls[dimension].invert(sl[0]);
							max = $$dimensions.controls[dimension].invert(sl[1]);
							$$dimensions.filters[dimension] = {'min':min,'max':max};						
						}
					}

				} else {
					delete $$dimensions.filters[dimension];
					var filterbox = svgBody.select('#filter-box-'+dimension).style('display','none');
					//$$dataFiltered = $$data;
				}
				var oldFilter = JSON.stringify($$dataFilterBuffer), newFilter = JSON.stringify($$dimensions.filters);
				if (oldFilter!=newFilter) {
					filterData();
					drawFiltered();
				}
				$$dataFilterBuffer = $.extend(true,{},$$dimensions.filters);
				scope.$apply();
			}

			scope.$watch('filter', function(newD,oldD) {
				if (!startWatch) return;
				if ('wells' in newD) {
					$$dimensions.filters['wellname'] = {'ordinal':newD['wells']};
				}
				filterData();
				drawFiltered();
			},true);

			scope.$watch('context', function(newD,oldD) {
				//console.log('context',newD);
				if ('dimensionOrder' in newD) {
					//var c = JSON.stringify($$dimensions.columns);
					var nc = JSON.stringify(newD['dimensionOrder']);
					var oc = JSON.stringify(oldD['dimensionOrder']);
					//console.log(c,nc,oc);
					if (oc!=nc) {
						console.log('order is different from current',c,nc);
						seriesToPlot.dimensions = newD['dimensionOrder'];
						$$dimensions.columns = newD['dimensionOrder'];
						init();
						initDimensions();
						drawFiltered();
					}
					/*
					if (c!=nc) $$dimensions.columns = newD['dimensionOrder'];
					initDimensions();
					*/
				}
			},true);

			scope.$watch('events', function(newD,oldD) {
				if (newD) {
					if ('animate' in newD) {
						var dname = newD['animate'];
						if (dname=='') {
							console.log('stopping animation');
							hollywood.stop();
							hollywood = null;
						} else {
							animate(dname);
						}
					}
					if ('plot' in newD) {
						run();
					}
				}
			},true);

			scope.$watch('data', function(newD,oldD) {
				if (newD.length > 0) run();
				//console.log(newD);

				//console.log('woot',newD);
			}, true);
		}
	}
	return directiveDefObj;
}]);
