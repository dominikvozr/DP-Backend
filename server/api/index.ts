import * as express from 'express';

import publicExpressRoutes from './public';
import professorExamApi from './professor';
import StudentTestApi from './student';
import professorPipelineApi from './pipeline';
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
  server.use('/api/v1/user', isAuthenticated, userExpressRoutes, handleError);
  server.use('/api/v1/professor/exam', isAuthenticated, professorExamApi, handleError);
  server.use('/api/v1/student/test', isAuthenticated, StudentTestApi, handleError);
  server.use('/api/v1/pipeline', isAuthenticated, professorPipelineApi, handleError);
}
