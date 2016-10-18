var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var firstnames = [
	'Aaron','Amelia','Alfie','Ava','Archie','Alexander','Alice','Amy','Anna','Alex','Anabel',
	'Brooke','Bobby','Bella','Ben','Bethany','Blake','Beatrice','Baby','Bailey','Bradley','Brompton',
	'Charlie','Cameron','Chloe','Charlotte','Connor','Cameroon','Caitlin','Cara','Caleb','Connie',
	'Daniel','Daisy','Dylan','David','Darcey','Danny','Darragh','Dominic','Dakota','Danielle',
	'Eric','Erlang','Elizabeth','Elder','Ernest','Edgar',
	'Francis','Frenny',
	'Gracie','Georgia','Gloria','George','Greg',
	'Henry','Harry',
	'Isla','Isabella','Isaac','Ivy','Iris','Issac','Indiana',
	'John','Juliet','Jean','Jerry','Jake', 'Janna',
	'Katie','Kyle','Kaiden','Keira',
	'Lily','Logan','Louise','Lenny','Lynn',
	'Mia','Max','Mason','Millie','Megan',
	'Noah','Niam','Nicole','Nicholas',
	'Oliver','Olivia',
	'Poppy','Polly','Page','Paris','Penelope','Pepper',
	'Qasim','Qi','Qing','Quentin',
	'Riley','Reuben','Ryan','Rachel','Rose',
	'Sophie','Sophia','Sebastian',
	'Toby','Thomas','Tilly','Terry',
	'Uma','Umair','Ursula','Usama',
	'Victor','Vanessa','Varun','Vaughan','Violet',
	'Willow','William','Winnie','Walter',
	'Xander','Xaview','Xi','Xing',
	'Yahya','Yanis','Yash',
	'Zara','Zachary','Zac','Zak',
];

var lastnames = [
	'Arroyo', 'Amber','Ang',
	'Bong','Bing','Biang','Boston','Baron',
	'Chong','Ching','Chang','Chok',
	'Ding','Dong','Diong','Deng',
	'Eng',
	'Foo','Fook','Flannigan',
	'Gong',
	'Hong','Hopkins', 'Hanson',
	'India',
	'Jones','Jia','Jong','Jones',
	'King','Kong','Kang',
	'Lim','Lam','Leornado',
	'Ming','Mandel','Mongo',
	'Ning',
	'Ong', 'Oscar',
	'Pen', 'Poh',
	'Quek','Quincie','Quinn',
	'Rinong', 'Rafidah',
	'Song','Sie','See',
	'Tiong','Teng','Trong','Teller', 'Teng','Thomas',
	'Undula',
	'Varun', 'Voon',
	'Wang','Woo','Wee','Wong','Whyte','White','Whitley',
	'Xiang','Xavier',
	'Yong', 'Yi','Yee','Yap',
	'Zing','Zang','Zorro',
];


router.get('/addusers', function(req,res) {
	var _count = 0;
	Models.user.find().count(function(err, count){
		_count = count;
    	console.log("Number of docs: ", count );
		if (_count > 500) {
			res.send('Not creating because population exceeds limit.');
		} else {
			for (var i=0;i < 500;i++) {
				var _name = firstnames[Math.floor(Math.random() * firstnames.length)] + ' ' + lastnames[Math.floor(Math.random()* lastnames.length)];
				var u = new Models.user({name:_name}).save(function(err) {
					if (err) {
						console.log(err);
					} else {
						console.log(_name + ' successfully saved.');
					}
				});
				console.log(_name);
			}
			res.send('Ok');
		}
	});
});
