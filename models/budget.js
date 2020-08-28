const mongoose = require('mongoose');
const BudgetSchema = new mongoose.Schema({
	catagory: {
		type: String,
		unique: false,
		required: true,
		trim: true
	},
	budget: {
		type: Number,
		required: true, 
		trim: true
	},
	monthId: {
		type: String,
		required: true
	},
	spent: {
		type: Number,
		required: true
	}
}, {timestamps: true});

const Budget = mongoose.model('Budget', BudgetSchema);
module.exports = Budget;