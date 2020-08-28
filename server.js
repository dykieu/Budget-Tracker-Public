// Loads in local mongo db if in devEnv
// Add .env to gitignore for sensitive info
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compressions = require('compression');
const app = express();
const exLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const csrf = require('csurf');
const csurfProtection = csrf({cookie: false});

// References
const indexRoute = require('./routes/index');

// Set folders and layouts of server
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(exLayouts);
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/models'));

// Server security (Prevents external scripts not trusted)
app.use(helmet.contentSecurityPolicy({
	directives: {
		defaultSrc:["'self'"
	],
		scriptSrc:["'self'",
		'code.jquery.com',
		'cdn.jsdelivr.net',
		'kit.fontawesome.com'
	],
		styleSrc:["'self'",
		'kit.fontawesome.com',
		'cdn.jsdelivr.net',
		'fonts.googleapis.com',
		'kit-free.fontawesome.com'
	],
		fontSrc:["'self'",
		'fonts.googleapis.com',
		'fonts.gstatic.com',
		'kit-free.fontawesome.com']
	}
}));
app.use(compressions());

// Sets Standard Port
app.set('port', (process.env.PORT || 3000));

// parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//	mongodb
mongoose.connect(process.env.DATABASE_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false,
	dbName: 'Spreadsheet'	
}).then(() => {
	console.log('Database connection successfully established');
}).catch((err) => {
	console.error(err);
});

// Connecting DB
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Storing Sessions
app.use(session({
	secret: `Spreadsheet`,
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: db
	})
}));

// Provides user id within templates
app.use((req, res, next) => {
	res.locals.currentUser = req.session.userId;
	next();
});

// Routes
app.use('/', indexRoute);

// catch 404 then forward to error handler
app.use((req, res, next) => {
	const err = new Error('File Not Found');

	err.status = 404;
	next(err);
});

// Error Handler
app.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

// Running server
app.get('/', (request, response) => {
	let result = 'App is running';
	response.send(result);
  }).listen(app.get('port'), () => {
	console.log(`Visit application here: http://localhost:${app.get('port')}`);
  });