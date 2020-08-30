const express = require('express');
const router = express.Router();
const fs = require('fs');

// Mongo Collections
const User = require('../models/user');
const Account = require('../models/account');
const Month = require('../models/month');
const Budget = require('../models/budget');
const Deposit = require('../models/deposit');
const Expenditure = require('../models/expenditures');

const { nextTick } = require('process');
const { findById, findByIdAndUpdate, findByIdAndDelete, find } = require('../models/user');

// Utility JS functions
const spliceDate = require('../public/js/spliceData');
const daysInMonth = require('../public/js/daysInMonth');
const getDate = require('../public/js/getDate');

// CSURF Protection
const csrf = require('csurf');
const csurfProtection = csrf({cookie: false});

/******************************************************************
 * 
 *  						[HOME PAGE]{GET}
 * 
 * Router to home index. Retrieves data in-order to render tables
 * and graphs for the page
 * 
*******************************************************************/
router.get('/',csurfProtection , async (req, res, next) => {
	// Checks that User is logged in
	if (req.session.userId) {
		// Variables
		let curMo = getDate();
		let accounts, findMonth, findDeposits, budget;
		let allDeposits = [];
		let today = new Date();
		let start = new Date(today.getFullYear(), today.getMonth(), 01);
		let end = new Date(today.getFullYear(), today.getMonth(), daysInMonth(today.getMonth() + 1, today.getFullYear()));

		try {
			// Finds the account
			accounts = await Account.find({userId: req.session.userId});

			// Grab Month and budget for it
			findMonth = await Month.findOne({month: curMo[0], year: curMo[1], userId: req.session.userId});
	
			// If current month exists, grab budget
			if (findMonth) {
				budget = await Budget.find({monthId: findMonth.id}).orFail();
			}

			// Grab monthly deposits
			if (accounts != '' && accounts != null) {
				for (let i = 0; i < accounts.length; i++) {
					findDeposits = await Deposit.find({
						createdAt: {
							$gte: start,
							$lt: end
						},
						bankId: accounts[i].id
					});
					allDeposits.push(findDeposits.reverse());
				}
				console.log(allDeposits);
			}
		} catch (err) {
			console.error(err);
			return next(err);
		}
		console.log(budget);
		
		return res.render('index', {title: 'Home', name: req.session.name,
		 bankAcc: accounts,
		  budget: budget,
		   deposits: allDeposits,
		    depositRange: {
				start: start.toISOString().substr(0, 10),
				end: end.toISOString().substr(0, 10)
			}
		});
	} else {
		const cToken = req.csrfToken();
		req.session.cToken = cToken;
		return res.render('login', {csrf: cToken});
	}
});

/******************************************************************
 * 
 *  					[SIGNUP PAGE]{GET}
 * 
 * GET Router to the signup page. Renders the static webpage
 * 
*******************************************************************/
router.get('/su',csurfProtection , (req, res, next) => {
	const cToken = req.csrfToken();
	req.session.cToken = cToken;
	return res.render('signup', {csrf: cToken});
});

/******************************************************************
 * 
 *  					[SIGNUP PAGE]{POST}
 * 
 * POST router for the signup page. Recieves a form with the user's
 * name, username, and password. Creates a account for the user
 * and then redirects towards the home page
 * 
*******************************************************************/
router.post('/su', (req, res, next) => {
	if (req.body.csrf ===  req.session.cToken) {
		if (req.body.username && req.body.password && req.body.name) {
			let data = {
				name: req.body.name.toLowerCase(),
				username: req.body.username.toLowerCase(),
				password: req.body.password
			};
	
			User.create(data, (error, user) => {
				if (error) {
					if (error.name == 'MongoError' && error.code == 11000) {
						console.error('Error - Unable to create account');
						let err = new Error('Error - Name already exists, please try a different one');
						err.status = 401;
						return next(err);
					} else {
						console.error(error);
						return next(error);
					}
				} else {
					console.log('Console - Account successfully created');
					return res.redirect('/');
				}
			});
		} else {
			let error = new Error('Error - Field left blank');
			error.status = 401;
			return next(error);
		}
	} else {
		let error = new Error('Error - Invalid csrf');
		error.status = 401;
		return next(error);
	}
});

/******************************************************************
 * 
 *  					[LOGIN PAGE]{POST}
 * 
 * POST router for the login page. Handles login requests when it
 * recieves a username and password. It will run an authentication
 * check and set session data respectively if valid credentials
 * 
*******************************************************************/
router.post('/login', (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		if (req.body.username && req.body.password) {
			User.authenticate(req.body.username, req.body.password, (error, user) => {
			  if (error || !user) {
				console.error('Error - Unable to validate credentials');
				let err = new Error('Error - Wrong username or password');
				err.status = 401;
				return next(err);
			  } else {
				console.log('Console - Login Successful');
				req.session.userId = user.id;
				req.session.name = user.name.toLowerCase();
				return res.redirect('/');
			  }
			});
		} else {
			let err = new Error('Error - Field left blank');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

/******************************************************************
 * 
 *  					[LOGOUT PAGE]{GET}
 * 
 * GET Router to handle logout functionality. Will clear current
 * session and destroy it. Aftwerwards it will redirect towards
 * the home/login page
 * 
*******************************************************************/
router.get('/logout', (req, res, next) => {
	if (req.session) {
		req.session.destroy((error) => {
			if (error) {
				return next(error);
			} else {
				console.log('Console - Successfully logged out');
				return res.redirect('/');
			}
		});
	} else {
		console.error('Error - No user session found');
		let error = new Error('Error - No user session found');
		error.status = 401;
		return next(error);
	}
});

/******************************************************************
 * 
 *  					[ADD PAGE]{GET}
 * 
 * GET Router to the add page. Renders the static webpage to add
 * various things into the database.
 * 
*******************************************************************/
router.get('/add',csurfProtection , async (req, res, next) => {
	if (req.session.userId) {
		let findBudget, findMonth, findBank;
		let today = getDate();
		let catagoryArr = [];
		try {
			findMonth = await Month.find({month: today[0], year: today[1], userId: req.session.userId});
			if (findMonth != '' && findMonth != undefined) {
				findBudget = await Budget.find({monthId: findMonth[0]._id});
				let findOther = false;
				for (let i = 0; i < findBudget.length; i++) {
					let repeat = false;
					if (catagoryArr.length != 0 || catagoryArr.length != '') {
						for (let j = 0; j < catagoryArr.length; j++) {
							// Tracks if there are repeated catagories
							if (catagoryArr[j].toLowerCase() == findBudget[i].catagory.toLowerCase()) {
								repeat = true;
							}
		
							// Finds a other or etc catagory
							if (catagoryArr[j].toLowerCase() == 'other' || catagoryArr[j].toLowerCase() == 'etc' ) {
								findOther = true;
							}
						}
					}
		
					if (repeat == false) {
						catagoryArr.push(findBudget[i].catagory.toLowerCase());
					}
				}

				// Ensures atleast 1 catagory for spending
				if (findOther == false) {
					catagoryArr.push('etc');
				}
			}
	
			findBank = await Account.find({userId: req.session.userId});
			const cToken = req.csrfToken();
			req.session.cToken = cToken;
			return res.render('add', {
				title: 'Add Entries',
				catagories: catagoryArr,
				banks: findBank,
				csrf: cToken
			});
		} catch(err) {
			console.error(err);
			return next(err);
		}
	} else {
		let err = new Error('Error - Not logged in');
		err.stratus = 401;
		return err;
	}
});

/******************************************************************
 * 
 *  					[ADD PAGE]{POST}
 * 
 * POST Router to the add page. Recieves the add bank form and 
 * proceeds to add a bank account into the database if there is
 * not already a similar bank account for the current user.
 * 
*******************************************************************/
router.post('/add/bank', async (req, res, next) => {
	// Checks that all fields and filled
	if (req.body.csrf === req.session.cToken) {
		if (req.body.bankName && req.body.bankBalance) {
			let findBank;
			try {
				// Check for duplicate bank entry
				findBank = await Account.find({bankName: req.body.bankName.toLowerCase(), userId: req.session.userId});
				if (findBank != '') {
					let err = new Error('Error - Bank account already exists');
					err.status = 401;
					return next(err);
				} else {
					// Creates the bank account
					let data = {
						userId: req.session.userId,
						bankName: req.body.bankName.toLowerCase(),
						balance: req.body.bankBalance
					};
					findBank = await Account.create(data);

					// Console message for completion
					if (findBank != '') {
						console.log('Console - Successfully added bank account');
					} else {
						let err = new Error('Error - Unable to add bank account');
						err.status = 401;
						return next(err);
					}
				}
			} catch(err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/');
		} else {
			let error = new Error('Error - Bank form field left empty');
			error.status = 401;
			return next(error);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

/******************************************************************
 * 
 *  					[ADD PAGE]{POST}
 * 
 * POST Router to the add page. Recieves the add budget form and 
 * proceeds to add a budget constraint into the database if there is
 * not already a similar budget constraint for the current user 
 * and month.
 * 
*******************************************************************/
router.post('/add/budget', async (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		// Checks that fields are filled out
		if (req.body.budgetName && req.body.budgetBalance && req.body.budgetDate) {
			// Format date
			let splitDate = spliceDate(req.body.budgetDate);
			let mo = splitDate[1];
			let yr = splitDate[0];

			try {
				// Find if a month already exists
				const findMonth = await Month.findOne({month: mo, year: yr, userId: req.session.userId});
				
				let moId;
				let numDays = daysInMonth(yr, mo);
				let data = {
					month: mo,
					year: yr,
					userId: req.session.userId,
					monthDuration: numDays
				};
				
				// If month doesn't exist, create it
				if (!findMonth) {
					console.log('Console - No month found, creating month');
					try {
						let newMo = await Month.create(data);
						moId = newMo.id;
					} catch (err) {
						console.error(err);
						return next(err);
					}
				} else {
					moId = findMonth.id;
				}
				
				// Create a Budget Catagory
				let formattedNum = parseFloat(req.body.budgetBalance);
				formattedNum.toFixed(2);
				let data2 = {
					catagory: req.body.budgetName.toLowerCase(),
					budget: formattedNum,
					monthId: moId,
					spent: 0
				};

				await Budget.create(data2);
				console.log('Console - Successfully created budget');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/');
		} else {
			let err = new Error(' Error - Budget form field left empty');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

/******************************************************************
 * 
 *  					[ADD PAGE]{POST}
 * 
 * POST Router to the add page. Recieves the add deposit form and 
 * proceeds to add a deposit to the designated bank account if that
 * account exists. It will also proceed to store itself as 'deposits'
 * 
*******************************************************************/
router.post('/add/deposit', async (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		// Checks fields are filled
		if (req.body.bankName && req.body.depositAmt && req.body.depositType != 0) {
			let findBank;
			const today = new Date();

			// Checks that bank exists and under the current user
			try {
				// Attempts to find the bank account to add a deposit to
				findBank = await Account.find({bankName: (req.body.bankName).toLowerCase(), userId: req.session.userId})
				.orFail(new Error('Error - Unable to find specified bank account'));

				// If bank exists, creates a deposit
				let formatDate = String(today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate())).slice(-2));
				let data = {
					type: req.body.depositType.toLowerCase(),
					amount: req.body.depositAmt,
					date: formatDate,
					description: req.body.depositDesc,
					bankId: findBank[0].id
				};
				let check = await Deposit.create(data);

				// If Successfully added the check, add balance to bank
				if (check != '') {
					// Add balance to the bank
					let newBalance = (findBank[0].balance + check.amount).toFixed(2);
					let newData = {
						bankName: findBank[0].bankName.toLowerCase(),
						userId: findBank[0].userId,
						balance: newBalance
					};
					findBank = await Account.findOneAndUpdate({bankName: findBank[0].bankName, userId: findBank[0].userId}, newData)
					.orFail(new Error('Error - Unable to update bank balance'));
					
					// Checks for success
					if (findBank != '') {
						console.log('Console - Successful deposit');
					}
				}

			} catch (err) {
				console.error(err);
				return next(err);
			}

			return res.redirect('/');
		} else {
			let err = new Error(' Error - Deposit field left blank');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

/******************************************************************
 * 
 *  					[ADD PAGE]{POST}
 * 
 * POST Router to the add page. Recieves the add expenditure form and 
 * proceeds to add a expenditure to the designated bank account if that
 * account exists. It will also proceed to store itself as an
 * expenditure and log itself with the budget
 * 
*******************************************************************/
router.post('/add/spending', async (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		if (req.body.bankName && req.body.spendAmt && req.body.spendType != 0) {
			let findBank;
			const today = new Date();
	
			// Checks that bank exists and under the current user
			try {
				// Attempts to find the bank account specified
				findBank = await Account.find({bankName: (req.body.bankName).toLowerCase(), userId: req.session.userId})
				.orFail(new Error('Error - Bank not found'));
				
				// If bank found, attempts to create and expenditure
				let formatDate = String(today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate())).slice(-2));
				let data = {
					catagory: req.body.spendType.toLowerCase(),
					amount: req.body.spendAmt,
					date: formatDate,
					description: req.body.spendDesc,
					bankId: findBank[0].id
				};
				let log = await Expenditure.create(data);
	
				// If expenditure can be made, updates bank balance
				let newBalance = (parseFloat(findBank[0].balance) - parseFloat(log.amount)).toFixed(2);
				let newData = {
					bankName: findBank[0].bankName.toLowerCase(),
					userId: findBank[0].userId,
					balance: newBalance
				};
			
				findBank = await Account.findOneAndUpdate({bankName: findBank[0].bankName.toLowerCase(), userId: findBank[0].userId}, newData)
				.orFail(new Error('Error - Unable to update bank balance with new expenditure'));
	
				// If adding to bank successful, update monthly budget if possible else redirect user
				let findMonth;
				let curMo = getDate();
				findMonth = await Month.findOne({month: curMo[0], year: curMo[1], userId: req.session.userId}).orFail(() => {
					console.error('Error - unable to find current month, redirecting...');
					return res.redirect('/');
				});
	
				if (findMonth != '') {
					// Attempts to find applicable budget type
					budget = await Budget.findOne({monthId: findMonth.id, catagory: req.body.spendType.toLowerCase()})
					.orFail(new Error('Error - Unable to find budget catagory specified, Bank and expenditure is updated but budget will not be'));
	
					// If budget exists, add the spending to it
					if (budget != '') {
						let newSpent = (parseFloat(budget.spent) + parseFloat(req.body.spendAmt)).toFixed(2);
						console.log(newSpent);
						budget = await Budget.findOneAndUpdate({monthId: findMonth.id, catagory: req.body.spendType.toLowerCase()}, {
							spent: newSpent
						}).orFail(new Error('Error - Unable to add expenditure to budget'));
					}
				}
				return res.redirect('/');
			} catch (err) {
				console.error(err);
				return next(err);
			}
		} else {
			let err = new Error(' Error - Deposit field left blank');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

router.get('/add/add', (req, res, next) => {
	return res.redirect('/add');
});

/**
 * 
 * 
*/

router.get('/logistics', csurfProtection, async (req, res, next) => {
	// Checks that User is logged in
	if (req.session.userId) {
		// Variables
		let curMo = getDate();
		let findMonth, findDeposits, findBank, budget, expenditure;
		let allDeposits = [];
		let allExpenditures = [];
		let today = new Date();
		let start = new Date(today.getFullYear(), today.getMonth(), 01);
		let end = new Date(today.getFullYear(), today.getMonth(), daysInMonth(today.getMonth() + 1, today.getFullYear()));

		// Grab Month and budget for it
		try {
			
			findMonth = await Month.findOne({month: curMo[0], year: curMo[1], userId: req.session.userId});
			
			// If current month exists, grab budget && expenditure
			if (findMonth != '' && findMonth != undefined) {
				budget = await (await Budget.find({monthId: findMonth.id}));
				if (budget != '' && budget != undefined) {
					budget.reverse();
				}
			}
			
			// Grabs user bank accounts
			findBank = await Account.find({userId: req.session.userId});

			// Grab monthly deposits
			if (findBank != '' && findBank != undefined) {
				for (let i = 0; i < findBank.length; i++) {
					findDeposits = await Deposit.find({
						createdAt: {
							$gte: start,
							$lt: end
						},
						bankId: findBank[i].id
					});
					allDeposits.push(findDeposits.reverse());

					//Grab expenditures within month
					expenditure = await Expenditure.find({
						createdAt: {
							$gte: start,
							$lt: end
						},
						bankId: findBank[i].id
					});
					allExpenditures.push(expenditure.reverse());
				}
			}
		} catch (err) {
			console.error(err);
			return next(err);
		}

		const cToken = req.csrfToken();
		req.session.cToken = cToken;

		return res.render('logistics', {
			title: 'Logs',
			deposits: findDeposits,
			expenditure: expenditure,
			budget: budget,
			banks: findBank,
			dateRange: {
				start: start.toISOString().substr(0, 10),
				end: end.toISOString().substr(0, 10)
			},
			csrf: cToken
		});
	} else {
		console.error('Error - Can not find user session');
		let err = new Error('Error - Not logged in');
		err.status = 401;
		return next(err);
	}
});

router.post('/logistics/edit', async (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		// Checks if deposit or expenditure edit
		if (req.body.dep2Edit) {
			let findDeposit, findBank;
			try {
				findDeposit = await Deposit.findById(req.body.dep2Edit);
				findBank = await Account.findById(findDeposit.bankId);
				let newBal = (parseFloat(findBank.balance) - parseFloat(findDeposit.amount) + parseFloat(req.body.depositAmt)).toFixed(2);
				findBank = await Account.findByIdAndUpdate(findDeposit.bankId, {
					balance: newBal
				});
				findDeposit = await Deposit.findByIdAndUpdate(req.body.dep2Edit, {
					type: req.body.depositType,
					description: req.body.depositDesc,
					amount: req.body.depositAmt
				});
				console.log('Console - Successfully updated deposit and balance');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/logistics');
		} else if (req.body.exp2Edit) {
			let findExpenditure, findBank;
			try {
				findExpenditure = await Expenditure.findById(req.body.exp2Edit);
				findBank = await Account.findById(findExpenditure.bankId);
				let newBal = (parseFloat(findBank.balance) + parseFloat(findExpenditure.amount) - parseFloat(req.body.spendAmt)).toFixed(2);
				findBank = await Account.findByIdAndUpdate(findExpenditure.bankId, {
					balance: newBal
				});
				findDeposit = await Expenditure.findByIdAndUpdate(req.body.exp2Edit, {
					type: req.body.spendType,
					description: req.body.spendDesc,
					amount: req.body.spendAmt
				});
				console.log('Console - Successfully updated expenditure and balance');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/logistics');
		} else {
			console.error('Error - Logistics did not receive data to edit');
			let err = new Error('Error - Unable to receive data to edit, contact admin');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

router.post('/logistics/delete', async (req, res, next) => {
	if (req.body.csrf === req.session.cToken) {
		// Checks if deposit or expenditure to delete
		if (req.body.dep2Del) {
			let findDeposit, findBank;
			try {
				findDeposit = await Deposit.findById(req.body.dep2Del);
				findBank = await Account.findById(findDeposit.bankId);
				let newBal = (parseFloat(findBank.balance) - parseFloat(findDeposit.amount)).toFixed(2);
				findBank = await Account.findByIdAndUpdate(findDeposit.bankId, {
					balance: newBal
				});
				findDeposit = await Deposit.findByIdAndDelete(req.body.dep2Del);
				console.log('Console - Successfully deleted deposit and updated balance');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/logistics');
		} else if (req.body.exp2Del) {
			let findExpenditure, findBank;
			try {
				findExpenditure = await Expenditure.findById(req.body.exp2Del);
				findBank = await Account.findById(findExpenditure.bankId);
				let newBal = (parseFloat(findBank.balance) + parseFloat(findExpenditure.amount)).toFixed(2);
				findBank = await Account.findByIdAndUpdate(findExpenditure.bankId, {
					balance: newBal
				});
				findExpenditure = await Expenditure.findByIdAndDelete(req.body.exp2Del);
				console.log('Console - Successfully deleted expenditure and updated balance');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/logistics');
		} else if (req.body.bank2Del) {
			// Checks that bank exists, removes expenditures and deposits of the bank then remove bank
			let findBank, findExpenditure, findDeposit;
			try {
				findBank = await Account.findById(req.body.bank2Del);
				findExpenditure = await Expenditure.deleteMany({
					bankId: req.body.bank2Del
				});
				console.log(findExpenditure);
				findDeposit = await Deposit.deleteMany({
					bankId: req.body.bank2Del
				});
				findBank = await Account.findByIdAndDelete(req.body.bank2Del);
				console.log('Console - Successfully delete bank account (Including expenditures and deposits)');
			} catch (err) {
				console.error(err);
				return next(err);
			}
			return res.redirect('/logistics');
		} else {
			console.error('Error - Logisitics did not receive data to delete');
			let err = new Error('Error - Unable to receive data to delete, contact admin');
			err.status = 401;
			return next(err);
		}
	} else {
		let err = new Error('Error - Invalid CSRF');
		err.status = 401;
		return next(err);
	}
});

// Send data to server
module.exports = router;