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

app.directive('wellcontext',
	['$window', function($window) {

	// Well log chart

	var directiveDefObj = {
		restrict: 'E',
		templateUrl: '/templates/d3/wellcontext.html',
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
					h : (attrs.height)? attrs.height:600,
					w : (attrs.width)? attrs.width:300,
					}
				}

			var zoomFactor = 1;

			var elementWidth = windowDim().w;
			var elementHeight= windowDim().h;
			var totalHeaderHeight = 10;

// ****** Layout main SVG framework 
			var svg = d3.select('svg')
				//.attr('height', elementHeight + margin.top+margin.bottom)
				//.attr('width', 15)
				.attr('height',windowDim().h)
				.style('border','1 solid #000')
				.style('padding','0');
			var el = {
				selectedDepthG 	: d3.select('#selected-depth'),
				wellboreLine	: d3.select('#well-bore-line'),
				selectedDepth 	: {
					topDepth 	: d3.select('#top-depth'),
					btmDepth 	: d3.select('#btm-depth'),
					zone 		: d3.select('#zone')
				},
				tdDepth 		: d3.select('#td-depth'),
				tdG 			: d3.select('#target')
			}

			var elementOriginalState = {		// element initial size - used for calculating element resizes
				h: elementHeight,
				w: elementWidth
			}

			var obj = {
				headerHeight 	: 	15,
				footerHeight 	: 	7
			}

			function init() {
				el.selectedDepthG.style('display','none');
				el.tdDepth.text('N/A');
			}
			init();

			function draw() {
				el.wellboreLine.attr('y2',(elementHeight - obj.headerHeight - obj.footerHeight));
				el.tdG.attr('transform','translate(7,'+(elementHeight - obj.footerHeight)+')');
			}
			draw();

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