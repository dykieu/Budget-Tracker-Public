const mongoose = require('mongoose');
const AccSchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
		trim: true
	},
	bankName: {
		type: String,
		required: true,
		trim: true
	},
	balance: {
		type: Number,
		required: true,
		trim: true
	}
});

const Account = mongoose.model('Account', AccSchema);
module.exports = Account;