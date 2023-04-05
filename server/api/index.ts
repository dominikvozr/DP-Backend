import * as express from 'express';

import publicExpressRoutes from './public';
import professorExamApi from './professor';
import StudentTestApi from './student';
import professorPipelineApi from './pipeline';
import userExpressRoutes from './user';
import userCoderExpressRoutes from './coder-api/users'
import workspacesCoderExpressRoutes from './coder-api/workspaces'
import organizationsCoderExpressRoutes from './coder-api/organizations'

const apiRouter = express.Router();

function handleError(err, _, res, __) {
  console.error(err.stack);

  res.json({ error: err.message || err.toString() });
}

const isAuthenticated = (req, res, next) => {
  if (req.user === null || req.user === undefined)
    res.json({isAuthorized: false, user: {}})
  else next()
}

apiRouter.use('/api/v1/public', publicExpressRoutes, handleError);
apiRouter.use('/api/v1/user', isAuthenticated, userExpressRoutes, handleError);
apiRouter.use('/api/v1/professor/exam', isAuthenticated, professorExamApi, handleError);
apiRouter.use('/api/v1/student/test', isAuthenticated, StudentTestApi, handleError);
apiRouter.use('/api/v1/pipeline', isAuthenticated, professorPipelineApi, handleError);
apiRouter.use('/api/v1/coder',isAuthenticated,userCoderExpressRoutes,handleError);
apiRouter.use('/api/v1/coder/workspaces',isAuthenticated,workspacesCoderExpressRoutes,handleError);
apiRouter.use('/api/v1/coder/organizations',isAuthenticated,organizationsCoderExpressRoutes,handleError);

/* export default function api(server: express.Express) {
  server.use(`${process.env.BASE_PATH}/api/v1/public`, publicExpressRoutes, handleError);
  server.use(`${process.env.BASE_PATH}/api/v1/user`, isAuthenticated, userExpressRoutes, handleError);
  server.use(`${process.env.BASE_PATH}/api/v1/professor/exam`, isAuthenticated, professorExamApi, handleError);
  server.use(`${process.env.BASE_PATH}/api/v1/student/test`, isAuthenticated, StudentTestApi, handleError);
  server.use(`${process.env.BASE_PATH}/api/v1/pipeline`, isAuthenticated, professorPipelineApi, handleError);
} */
export default apiRouter
