var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
	name : {
		type: String,
		required: true, 
	},
	email : {
		type: String,
		required: true,
		default: 'user@foo.bar',
		validate:{
			validator: function(v) {
				if (v=='user@foo.bar') return false;
				var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
				return re.test(v);
			}
		}, 
		message:'User must have an email address'
	}
});

mongoose.model('users', usersSchema);
