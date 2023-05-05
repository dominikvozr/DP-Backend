/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';
//const requestId = require('express-request-id');
const cors = require('cors');
const requestReceived = require('request-received');
const responseTime = require('response-time');
const Cabin = require('cabin');
const { Signale } = require('signale');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser')

import { setupGoogleOAuth } from "./google-strategy";
import apiRouter from './api';
// helm upgrade studentcode-be-helm-chart helm-chart -f values.yaml
// eslint-disable-next-line
require('dotenv').config();

mongoose.set('strictQuery', false);
/* const username = process.env.MONGO_USERNAME;
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const database = process.env.MONGO_DATABASE;
const mongoService = process.env.MONGO_SERVICE;
const mongoPort = process.env.MONGO_PORT;

const uri = `mongodb://${username}:${password}@${mongoService}:${mongoPort}/${database}?retryWrites=true&w=majority`;

mongoose.connect(uri); */
// for development purpose only
mongoose.connect(process.env.MONGO_DB_TEST);

const cabin = new Cabin({
  axe: {
    logger: new Signale()
  }
});

// create express server
const server = express();
// adds request received hrtime and date symbols to request object
// (which is used by Cabin internally to add `request.timestamp` to logs
server.use(requestReceived);

// adds `X-Response-Time` header to responses
server.use(responseTime());

// adds or re-uses `X-Request-Id` header
//server.use(requestId());

server.use(express.json());

// support parsing of application/json data
server.use(bodyParser.json());

// support parsing of url encoded data
server.use(bodyParser.urlencoded({ extended: true }))

// use the cabin middleware (adds request-based logging and helpers)
server.use(cabin.middleware);

// CORS settings
server.use(
  cors({
    origin: [process.env.URL_APP, process.env.URL_API, process.env.GOOGLE_OAUTH_URL, process.env.ALLOWED_URI],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }),
);



// Session settings
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  name: process.env.SESSION_NAME,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
    secure: false,
  },
  store: new MongoStore({
    mongooseConnection : mongoose.connection,
    ttl: 14 * 24 * 60 * 60, // save session 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 1440, // clears every day
  })
}
server.use(session(sessionOptions))



// Settings for production
if (server.get('env') === 'production') {
  server.set('trust proxy', 1) // trust first proxy
  sessionOptions.cookie['secure'] = true // serve secure cookies
}

// Google authentication
setupGoogleOAuth({ server })
// API routes
// api(server);
if (process.env.BASE_PATH)
  server.use(process.env.BASE_PATH, apiRouter)
else
  server.use(apiRouter)

// Every unsatisfactory request returns 403 status code
server.get('*', (_, res) => {
  console.log(process.env.BASE_PATH)
  res.json('Nothing here!');
});



server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});
