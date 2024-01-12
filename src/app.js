/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const config = require('config');
const swaggerUi = require('swagger-ui-express');
const UserService = require('../src/api/common/user/userService');
const swaggerDocument = require('./swagger.json');
const logger = require('./utils/logger');
const br = require('../src/db/baseRepository');
const path = require('path');
const busboyBodyParser = require('busboy-body-parser');
require('./passport');
const superAdmin = require("./api/backend/superAdmin");
const registeredUser=require('./api/backend/registeredUser');
const payment = require("./api/backend/payment/index");


// common controllers
const authController = require('./api/common/auth/authController');
const userController = require('./api/common/user/userController');
const userPhotoController = require('./api/common/user/userPhotoController');
const settingsController = require('./api/common/settings/settingsController');

const SeedService = require('./api/seedService');
const seedService = new SeedService();
const app = express();
const { port, root } = config.get('api');
const { FILE_LOCATION } = config.get('path');
const db = require("./models");
db.sequelize.sync();
const models = require( './models/index');
// const application = require('./models/application');
//app.use(busboyBodyParser({ limit: '100mb' }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const customSwaggerOptions = {
  showExplorer: true,
  swaggerOptions: {
    authAction: {
      JWT: {
        name: 'JWT',
        schema: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Bearer <my own JWT token>',
        },
        value: 'Bearer <my own JWT token>',
      },
    },
  },
};

app.use(`${root}/swagger`, (req, res, next) => {
  swaggerDocument.host = req.get('host');
  req.swaggerDoc = swaggerDocument;
  next();
}, swaggerUi.serve, swaggerUi.setup(null, customSwaggerOptions));

app.use(express.static(path.join(FILE_LOCATION, 'public')));
app.use('/api/upload',express.static(FILE_LOCATION + "/public/upload/"));


app.use((err, req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-HTTP-Method-Override,X-Requested-With,Content-Type,Accept,content-type,application/json,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
  res.header("Access-Control-Allow-Credentials", true);
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      error: 'You are unauthorised'
    });
  }
});

function logErrors(err, req, res, next) {
  logger.error(err);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something went wrong.' });
  } else {
    next(err);
  }
}



const auth = passport.authenticate('jwt', { session: false });

// seed data in case of empty data base
setTimeout(() => {
  seedService.checkAndSeed()
}, 500);

// routes for common controllers
app.use(`${root}/auth`, authController);
// TODO: fix photo, it temporary solution
app.use(`${root}/users/:userId/photo`, userPhotoController);

app.use(`${root}/users`, auth, userController);
app.use(`${root}/settings`, auth, settingsController);

app.use(`${root}/superAdmin`, auth, superAdmin);
app.use(`/api`,registeredUser);
app.use(`/api/payment`,payment);

// app.use(`/api`,allowance);


app.use(logErrors);
app.use(clientErrorHandler);
const userService = new UserService();
app.get('/', (req, res) => {


var b=new br();

b.list().then((data )=> {
})

 models.User.findAll().then( userResponse => {
  res.status( 200 ).json( userResponse )
})
.catch( error => {
  res.status( 400 ).send( error )
})
});

app.listen(port);

logger.info(`Server start listening port: ${port}`);
