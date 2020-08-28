const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
		trim: true
	}
}, {timestamps: true});

// Authentication
UserSchema.statics.authenticate = (username, password, callback) => {
	User.findOne({ username: username }).exec((error, user) => {
		if (error) {
			return callback(error);
		}
		else if (!user) {
			let err = new Error('User not found.');
			err.status = 401;
			return callback(err);
		}
		bcrypt.compare(password, user.password, (error, result) => {
			if (result === true) {
				return callback(null, user);
			}
			else {
				return callback();
			}
		});
	});
};

// hash password before saving to database
UserSchema.pre('save', function (next) {
	var user = this;
	bcrypt.hash(user.password, 10, function (err, hash) {
		if (err) {
		return next(err);
		}
		user.password = hash;
		next();
	});
});
const User = mongoose.model('User', UserSchema);
module.exports = User;