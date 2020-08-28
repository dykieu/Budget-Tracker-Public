const mongoose = require('mongoose');
const ExpenditureSchema = new mongoose.Schema({
	amount: {
		type: Number,
		required: true
	},
	bankId: {
		type: String,
		required: true
	},
	catagory: {
		type: String,
		required: true
	},
	date: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: false
	}
}, {timestamps: true});

const Expenditure = mongoose.model('Expenditure', ExpenditureSchema);
module.exports = Expenditure;
