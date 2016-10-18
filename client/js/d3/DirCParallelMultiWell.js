// http://bl.ocks.org/mbostock/7586334
// http://bl.ocks.org/syntagmatic/2556042
// well log - multi-well parallel 


app.directive('cparallelmultiwell',
	['$window', function($window) {

	var directiveDefObj = {
		restrict: 'E',
		templateUrl: '/templates/d3/DirCParallelMultiWell.html',
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
			var canvas = document.querySelector('canvas');
			var context = canvas.getContext('2d');

			console.time('generate');
			var o = [];
			var alphabet = ['a','b','c','d','e','f','g','h','i','w','x','y','z'];
			for (var i=0;i<3000000;i++) {
				var d = {};
				for (var _i in alphabet) {
					var a = alphabet[_i];
					if (a=='x'||a=='y') {
						d[a] = Math.random() * 1000;
					} else {
						d[a] = Math.random() * 10;
					}
					
				}
				// var x = Math.random() * 1000, y = Math.random() * 500;
				// var w = Math.random() * 5, h = Math.random() * 5;
				// var d = {'x':x,'y':y,'h':h,'w':w};
				o.push(d);
			}
			console.log('generated ',o.length,'data points');
			console.timeEnd('generate');
			console.time('plot');
			for (var i in o) {
				var d = o[i];
				context.beginPath();
				context.rect(d.x,d.y,d.h,d.w);
				context.fillStyle = 'rgba(200,0,0,0.05)';
				//context.fillOpacity = 0.01;
				context.fill();
				context.closePath();
			}
			console.timeEnd('plot');
			console.log('woo')

		}
	}
	return directiveDefObj;
}]);
