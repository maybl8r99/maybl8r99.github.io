// JSONData = [
//   { "id": 3, "created_at": "Sun May 05 2013", "amount": 12000},
//   { "id": 1, "created_at": "Mon May 13 2013", "amount": 2000},
//   { "id": 2, "created_at": "Thu Jun 06 2013", "amount": 17000},
//   { "id": 4, "created_at": "Thu May 09 2013", "amount": 15000},
//   { "id": 5, "created_at": "Mon Jul 01 2013", "amount": 16000}
// ];
JSONData = [
  { "id": 3, "created_at": 1, "amount": 12000},
  { "id": 1, "created_at": 2, "amount": 2000},
  { "id": 2, "created_at": 3, "amount": 17000},
  { "id": 4, "created_at": 4, "amount": 15000},
  { "id": 5, "created_at": 5, "amount": 16000}
];
if (d3) console.log('wooooooo');
// http://pothibo.com/2013/09/d3-js-how-to-handle-dynamic-json-data/

(function() {
  var amountFn = function(d) {return d.amount}
  var dateFn = function(d) {return d.created_at;}
  var data = JSONData.slice();
  //var format = d3.time.format("%a %b %d %Y");

  var x = d3.time.scale()
    .range([10, 280])
    .domain(d3.extent(data, dateFn));

  var y = d3.scale.linear()
    .range([180, 10])
    .domain(d3.extent(data, amountFn));
  
  var svg = d3.select("#d3").append("svg:svg")
  .attr("width", 300)
  .attr("height", 200);

  svg.selectAll("circle").data(data).enter()
   .append("svg:circle")
   .attr("r", 4)
   .attr("cx", function(d) { return x(dateFn(d)) })
   .attr("cy", function(d) { return y(amountFn(d)) }) 
})();

