var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var institutionSchema = new Schema({
	name : {
		type: String,
		required: true, 
		validate:{
			validator: function(v) {
				return v.trim().length > 0;
			}
		}, 
		message:'Institution Name must not be empty'
	},
	country : {
		type: String,
		required: true,
		validate:{
			validator: function(v) {
				return v.trim().length > 0;
			}
		}
	},
	category : String,
	description : String,
	datePosted : {
		type: Date,
		default: Date.now,
	},
	author: String,
});

mongoose.model('institution', institutionSchema);
