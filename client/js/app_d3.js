$().ready(function(){
	//console.log(JSON.stringify($scope));
	console.log('D3 loaded');
	$('#brixmindApp').data('d3loaded',1);

});
var myVar = {};
var count = 0;
var clickme = function() {
	count++;
	console.log('clicked '+count);
		myVar = setInterval(function(){
			$('.block').fadeTo('slow',0.5).fadeTo('slow',1000)
			},1000);
	if (count % 2 == 0) {
		$('.block').css('background-color', $('.block').css('background-color') == 'rgb(0,0,255)' ? 'rgb(255,0,0)' : 'rgb(0,0,255)');
		clearInterval(myVar);
		console.log($('.block').css('background-color'));
	}	
}

