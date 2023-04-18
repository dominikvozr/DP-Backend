import * as express from 'express';

import publicExpressRoutes from './public';
import professorExamApi from './professor';
import StudentTestApi from './student';
import StudentEvaluationApi from './student/evaluation';
import professorPipelineApi from './pipeline';
import userExpressRoutes from './user';
import userCoderExpressRoutes from './coder-api/users'
import workspacesCoderExpressRoutes from './coder-api/workspaces'
import organizationsCoderExpressRoutes from './coder-api/organizations'
import gitExpressRoutes from './git';

const apiRouter = express.Router();

function handleError(err, _, res, __) {
  console.error(err.stack);

  res.json({ error: err.message || err.toString() });
}

const isAuthenticated = (req, res, next) => {
  console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  console.log(req.timezone);

  if (req.user === null || req.user === undefined)
    res.json({isAuthorized: false, user: {}})
  else next()
}
// Authorization middleware
const tokenAuthorize = (req, res, next) => {
  console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  console.log(req.timezone);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).send({ message: 'Unauthorized: Missing or invalid token.' });
  }

  const providedToken = authHeader.split(' ')[1];
  if (providedToken !== process.env.BE_TOKEN) {
      return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
  }
  next();
}

apiRouter.use('/api/v1/public', publicExpressRoutes, handleError);
apiRouter.use('/api/v1/user', isAuthenticated, userExpressRoutes, handleError);
apiRouter.use('/api/v1/user/git', isAuthenticated, gitExpressRoutes, handleError);
apiRouter.use('/api/v1/professor/exam', isAuthenticated, professorExamApi, handleError);
apiRouter.use('/api/v1/student/test', isAuthenticated, StudentTestApi, handleError);
apiRouter.use('/api/v1/student/evaluation', tokenAuthorize, StudentEvaluationApi, handleError);
apiRouter.use('/api/v1/pipeline', isAuthenticated, professorPipelineApi, handleError);
apiRouter.use('/api/v1/coder',isAuthenticated,userCoderExpressRoutes,handleError);
apiRouter.use('/api/v1/coder/workspaces',isAuthenticated,workspacesCoderExpressRoutes,handleError);
apiRouter.use('/api/v1/coder/organizations',isAuthenticated,organizationsCoderExpressRoutes,handleError);

export default apiRouter
