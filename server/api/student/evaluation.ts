/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import Test from './../../models/Test';
import SystemEvaluation from './../../service-apis/systemEvaluation';
const router = express.Router();

/*
Body: {testId: string}
*/
router.post('/evaluate', async (req: any, res: any) => {
  let test
  try {
    test = await Test.getAdminTestById(req.body.testId)
  } catch (error) {
    console.error(error);
    res.json(error)
  }
  test.isOpen = false;
  test.save()
  const resp = await SystemEvaluation.invokeEvaluation(test)
  if (resp.status === 200) {
    res.json(resp.message)
  } else {
    res.status(500).json(resp.message)
  }
});

// API endpoint for handling test results
router.post('/results', (req, res) => {
  try {
    Test.setTestResults(req.body.testId, req.body.results)
    // Send a response
    res.status(200).send({ message: 'Test results received successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error when getting results');
  }
});


export default router;