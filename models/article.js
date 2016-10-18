var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var articleSchema = new Schema({
	title : {
		type: String,
		validate:{
			validator: function(v) {
				return v.trim().length > 0;
			},
			message:'Title must not be empty'
		}, 
		required: true, 
	},
	content : String,
	datePosted : {
		type: Date,
		default: Date.now,
	},
	author: String,
});

mongoose.model('article', articleSchema);
//