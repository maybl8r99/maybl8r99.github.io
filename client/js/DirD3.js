app.directive('barchart', function($parse) {
	var directiveDefObj =  {
		restrict: 'E',
		replace: false,
		templateUrl: 'templates/DirD3.html',
		scope: {data: '=chartData'},
		link: function(scope, element, attrs) {
			scope['bcTitle'] = 'Bar Chart';
			//var data = attrs.chartData.split(',');
			var chart = d3.select(element[0]);
			var data = scope.data;
			//var max = Math.max(...data);
			function getMax() {
				var _max = Math.max(...data);
				return _max;
			}
			scope.$watch(function() {
				if (scope.data.length > 10) {
					data = scope.data.slice(scope.data.length-10);
				}
				chart.select('div').remove();
				draw();
			});
			function draw() {
				chart.append('div').attr('class','chart')
					.selectAll('div')
					.data(data).enter()
						.append('div')
						.style('background-color', 'red')
						.style('text-align','right')
						.text('-')
						.style('width', function(d) {
							return (d/getMax())*100 + '%';
						})
						.text(function(d){
							return d + '('+Math.floor((d/getMax())*100)+'%)';
						});
			}
		},
	}
	return directiveDefObj;
})

app.directive('dvdchart', ['$parse','$window', function($parse, $window) {
	var directiveDefObj = {
		restrict: 'E',
		replace: false,
		scope: {data: '=dvddata'},
		templateUrl: 'templates/d3/dvd.html',
		link: function(scope,element,attrs) {
			var scaleWindow = (attrs.scaletowindow)? true:false;
			var windowOriginalState = {
				h: $window.innerHeight,
				w: $window.innerWidth
			};
			var margin = {
				top: 20,
				right:80,
				bottom:50,
				left:50
			};
			var xAxis, yAxis;
			var svg = d3.select(element[0]).select('svg');
			var formatDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");;
			var width = getPixels(windowOriginalState.w,attrs.width,400);
			var height = getPixels(windowOriginalState.h,attrs.height,300);
			var elementOriginalState = {
				h: height,
				w: width
			}
			var minheight = 300, minwidth = 400;

			var g = svg.append('g');
			var x = d3.scaleTime().range([0, width]),
    			y = d3.scaleLinear().range([0,height-(margin.bottom)]),
    			z = d3.scaleOrdinal(d3.schemeCategory10);

    		xAxis = g.append("g").attr("id","xAxis");
    		yAxis = g.append("g").attr("id","yAxis");
			


			scope.$watch(function() {
				init();
			});

			var draw = function() {
				xAxis.select("#xAxis")
					.attr("id", "xaxis1")
	      			.attr("class", "axis axis--x")
	      			.attr("transform", "translate(0," + height + ")")
	      			.call(d3.axisBottom(x))
	      			.append("text")
	      				.attr("id","labelX")
	      				.attr("x", width - margin.right)
	      				.attr("y", +3)
	      				.attr("fill","#000")
	      				.text((attrs["labelX"])?attrs["labelX"]:"X-Axis");

				yAxis.select("#yAxis")
					.attr("id","yaxis1")
	      			.attr("class","axis axis--y")
	      			.call(d3.axisLeft(y))
					.append("text")
					.attr("id","labelY")
					.attr("transform", "rotate(-90)")
					.attr("y", -margin.left+8)
					.attr("x", -5)
					.attr("dy", "0.71em")
					.attr("fill", "#000")
					.text((attrs["labelY"])?attrs["labelY"]:"Y-Axis");
				//console.log('draw called');
			}

			var init = function() {				
				scope['screenwidth'] = width;
				scope['screenheight'] = height;
				svg.attr('width',(width < minwidth)? minwidth: width).attr('height',(height<minheight)? minheight:height);
				initScale();

			}

			var initScale = function() {
				// get maximum on all series and set transform for g

				g.attr('transform', 'translate('+margin.left+','+margin.top+')');
				x = d3.scaleTime().range([0,width-margin.right]);
				y = d3.scaleLinear().range([0,height-margin.bottom]);
				//redraw axis
				label = svg.selectAll('#labelX');
				label.attr('x', width-margin.right+15);
				svg.selectAll('.axis--x')
					.attr('transform','translate(0,'+(height-margin.bottom)+')')
					.call(d3.axisBottom(x));
				svg.selectAll('.axis--y').call(d3.axisLeft(y));
				draw();
			}

			if (scaleWindow)
			angular.element($window).bind('resize', function() {
				pctHeight = $window.innerHeight / windowOriginalState.h;
				pctWidth = $window.innerWidth / windowOriginalState.w;
				width = Math.floor(elementOriginalState.w * pctWidth);
				height = Math.floor(elementOriginalState.h * pctHeight);
				if (width < minwidth) width=minwidth;
				if (height < minheight) height = minheight;
				//console.log(width + ',' + height);
				init();
				scope.$digest();
			})
			init();

			// var t = g.append('g')
			// 	.selectAll('line')
			// 	.data(scope.data)
			// 	.enter()
			// 	.append('line')
			// 	.attr('x', function(d) { return d.depth })
			// 	.attr('y', function(d) { return d.datetime });
		}
	}
	return directiveDefObj;
}]);

app.directive('flower', ['$parse','$window', function($parse, $window) {
	var directiveDefObj =  {
		restrict: 'E',
		replace: false,
		templateUrl: 'templates/d3/dvd.html',
		//scope: {data: '=chartData'},
		link: function(scope, element, attrs) {
			scope['bcTitle'] = 'Bar Chart';
			//var data = attrs.chartData.split(',');
			var svg = d3.select('svg');
			//var data = scope.data;
			//var max = Math.max(...data);
			var width = +svg.attr('width');
			var height = +svg.attr('height');

			var g = svg.append('g').attr('transform','translate(' + (width / 2 + 40) + ',' + (height / 2 + 90) +')');

			var stratify = d3.stratify()
				.parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf('.'));});

			var tree = d3.tree()
				.size([360,500])
				.separation(function(a,b) {
					return (a.parent == b.parent?1:2) / a.depth;
				});

			d3.csv('data/flare.csv', function(err,data) {
				if (err) throw error;
				//g.remove();
				var root = stratify(data);

				tree(root);

				var link = g.selectAll('.link')
					.data(root.descendants().slice(1))
					.enter().append('path')
					.attr('class','link')
					.attr('d', function(d) {
						return 'M' + project(d.x, d.y)
							+  'C' + project(d.x, (d.y + d.parent.y) / 2)
							+  ' ' + project(d.parent.x, (d.y + d.parent.y) /2)
							+  ' ' + project(d.parent.x, d.parent.y);
					});

				var node = g.selectAll('.node')
					.data(root.descendants())
					.enter().append('g')
					.attr('class', function(d) {
						return 'node' + (d.children ? ' node--internal': ' node--leaf');
					})
					.attr('transform', function(d) {
						return 'translate(' + project(d.x, d.y) + ')';
					});

				node.append('circle')
					.attr('r', 2.5);

				node.append('text')
					.attr('dy', '.31em')
					.attr('x', function(d) { return d.x < 180 === !d.children ? 6: -6; })
					.style('text-anchor', function(d) {return d.x < 180 === !d.children ? 'start': 'end';})
					.attr('transform', function(d) { return 'rotate(' + (d.x < 180 ? d.x - 90: d.x + 90) + ')';})
					.text(function(d) {return d.id.substring(d.id.lastIndexOf('.')+1); });

			});

			function project(x,y) {
				var angle = (x-90) / 180 * Math.PI, radius = y;
				return [radius * Math.cos(angle), radius * Math.sin(angle)];
			}
		},
	}
	return directiveDefObj;
}])