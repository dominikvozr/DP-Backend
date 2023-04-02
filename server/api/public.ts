import * as express from 'express';

const router = express.Router();

router.get('/test', async (_, res) => {
  console.log('API server got request from APP server or browser');
  res.json('test');
});

export default router;
