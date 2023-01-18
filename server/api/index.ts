import * as express from 'express';

import publicExpressRoutes from './public';
import teamMemberExpressRoutes from './team-member';
import userExpressRoutes from './user';

function handleError(err, _, res, __) {
  console.error(err.stack);

  res.json({ error: err.message || err.toString() });
}

const isAuthenticated = (req, res, next) => {
  if (req.user === null) res.sendStatus(401)
  else next()
}

export default function api(server: express.Express) {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', isAuthenticated, teamMemberExpressRoutes, handleError);
  server.use('/api/v1/user', isAuthenticated, userExpressRoutes, handleError);
}
