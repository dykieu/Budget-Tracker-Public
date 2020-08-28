const mongoose = require('mongoose');
const MonthSchema = new mongoose.Schema({
	month: {
		type: Number,
		required: true
	},
	year: {
		type: Number,
		required: true
	},
	monthDuration: {
		type: Number,
		required: true
	},
	userId: {
		type: String,
		required: true
	}
}, {timestamps: true});

const Month = mongoose.model('Month', MonthSchema);
module.exports = Month;