const mongoose = require('mongoose');
const DepositSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		trim: true
	},
	amount: {
		type: Number,
		required: true
	},
	date: {
		type: String,
		required: true
	},
	description: {
		type: String,
	}, 
	bankId: {
		type: String,
		require: true
	}
}, {timestamps: true});

const Deposit = mongoose.model('Deposit', DepositSchema);
module.exports = Deposit;