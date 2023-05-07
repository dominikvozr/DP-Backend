/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import Test from './../../models/Test';
import Event from './../../models/Event';
import Jenkins from './../../service-apis/jenkins';
import Gitea from './../../service-apis/gitea';
const git = require('simple-git');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const glob = require('glob');

/*
Body: {testId: string}
*/
router.post('/evaluate', async (req: any, res: any) => {
  let test
  try {
    test = await Test.getAdminTestById(req.body.testId)
  } catch (error) {
    console.log(error);
    res.json(error)
  }

  const randomName = Math.random().toString(36).substring(2, 15);
  const tempDir = path.join(__dirname, randomName);
  const accessToken = test.user.gitea.accessToken.sha1
  const profAccessToken = test.exam.user.gitea.accessToken.sha1
  const adminAccessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN
  const repoName = `${test.user.gitea.username}/${test.slug}-student`

  try {
    // Clone project repository
    await git().clone(`http://${accessToken}@bawix.xyz:81/gitea/${repoName}.git`, tempDir);
    // setup git
    const projectRepo = git(tempDir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
    // Get all files that starts with tests* to project repository
    const testsRepoName = `${test.exam.user.gitea.username}/${test.exam.slug}-test`
    await Gitea.prepareTests(testsRepoName, profAccessToken, tempDir)
    // Get Jenkinsfile from the pipelines repository
    const pipelineRepoName = `${test.exam.pipeline.slug}-pipeline`
    await Gitea.preparePipeline(pipelineRepoName, repoName, adminAccessToken, tempDir, test._id)

    // Select all files in the directory except those starting with '.!'
    const files: string[] = await new Promise((resolve, reject) => {
      glob(path.join(tempDir, '*'), {ignore: '.!**'}, (err, matches) => {
        if (err) {
          reject(err);
        } else {
          resolve(matches);
        }
      });
    });

    // add, commit, and push changes to Gitea
    await projectRepo.add('-f', files);
    await projectRepo.commit('Add tests and Jenkinsfile');
    await projectRepo.push('origin', 'master', ['--force']);
    // start evaluation process on pushed test
    await Jenkins.startEvaluate(repoName, accessToken)
    Event.createEvent({
      userId: test.user._id,
      name: `Test evaluation started`,
      description: `${test.user.displayName}, your test evaluation has started.`,
      type: 'evaluationStarted',
    });
    console.log(`Successfully triggered Seed Job for ${repoName}`);
    // Clean up temporary directories
    fs.rmSync(tempDir, { recursive: true });
    res.send('Repository prepared successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error when preparing repository');
  }
});

// API endpoint for handling test results
router.post('/results', (req, res) => {
  try {
    console.log('Test Results:', req.body.results);
    Test.setTestResults(req.body.testId, req.body.results)
    // Send a response
    res.status(200).send({ message: 'Test results received successfully.' });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error when getting results');
  }
});


export default router;