import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as mongoose from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo')(session);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bodyParser = require('body-parser')

import { setupGoogleOAuth } from "./google-strategy";
import api from './api';

// eslint-disable-next-line
require('dotenv').config();
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_DB_TEST);

// create express server
const server = express();
server.use(express.json());
server.use(bodyParser.json()) // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true }))

// CORS settings
server.use(
  cors({
    origin: [process.env.URL_APP, process.env.URL_API, process.env.GOOGLE_OAUTH_URL],
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

server.get('/test', (_, res) => {
  console.log('API server got request from APP server or browser');
  res.json('test');
});

// Google authentication
setupGoogleOAuth({ server })
// API routes
api(server);



// Every unsatisfactory request returns 403 status code
server.get('*', (_, res) => {
  res.sendStatus(403);
});



server.listen(process.env.PORT_API, () => {
  console.log(`> Ready on ${process.env.URL_API}`);
});