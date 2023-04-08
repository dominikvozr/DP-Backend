/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
import * as express from 'express';
import Test from './../../models/Test';
const git = require('simple-git');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { exec } = require('child_process');


/*
Body: {test: Test}
*/
router.post('/evaluate', async (req, res) => {
  const randomName = Math.random().toString(36).substring(2, 15);
  const tempDir = path.join(__dirname, randomName);
  const accessToken = req.body.test.user.gitea.accessToken.sha1
  const profAccessToken = req.body.test.exam.user.gitea.accessToken.sha1
  const adminAccessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN
  const repoName = `${req.body.test.user.gitea.username}/${req.body.test.slug}-student`

  try {
    // Clone project repository
    await git().clone(`http://${accessToken}@bawix.xyz:81/gitea/${repoName}.git`, tempDir);
    const projectRepo = git(tempDir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
    await projectRepo.checkoutLocalBranch('test');

    // Get tests.java file from the tests repository
    await git().clone(`http://${profAccessToken}@bawix.xyz:81/gitea/${req.body.test.exam.user.gitea.username}/${req.body.test.exam.slug}-test.git`, path.join(tempDir, 'tests_repo'));
    const testsFilePath = path.join(tempDir, 'tests_repo', '1d2l4xdf2hkh.java');
    const destinationTestsFilePath = path.join(tempDir, '1d2l4xdf2hkh.java');
    fs.copyFileSync(testsFilePath, destinationTestsFilePath);

    // Get Jenkinsfile from the pipelines repository
    await git().clone(`http://${adminAccessToken}@bawix.xyz:81/gitea/gitea_admin/${req.body.test.exam.pipeline.slug}-pipeline.git`, path.join(tempDir, 'pipelines_repo'));
    const pipelinesFilePath = path.join(tempDir, 'pipelines_repo', 'Jenkinsfile');
    const destinationPipelinesFilePath = path.join(tempDir, 'Jenkinsfile');
    exec(`sed -i '' "s/\\[TEST_ID_HERE\\]/${req.body.test._id}/g" ${destinationPipelinesFilePath}`, (err, _stdout, _stderr) => {
        if (err) {
          throw new Error(err);
          // return res.status(500).send({ message: 'Error updating the Jenkinsfile.' });
        }
    });
    fs.copyFileSync(pipelinesFilePath, destinationPipelinesFilePath);

    // Create a new branch, commit, and push changes to Gitea
    await projectRepo.add('./*');
    await projectRepo.commit('Add tests.java and Jenkinsfile');
    await projectRepo.push('origin', 'test', ['--force']);

    await axios.post(
        `${process.env.JENKINS_URL}/job/StudentSeedJob/buildWithParameters?REPO_NAME=${repoName}&ACCESS_TOKEN=${accessToken}&REPO_URL=${process.env.GITEA_URL}/${repoName}.git`,
        {},
        {
          auth: {
            username: process.env.JENKINS_SC_NAME,
            password: process.env.JENKINS_SC_TOKEN,
          },
        }
      );
    console.log(`Successfully triggered Seed Job for ${repoName}`);

    // Clean up temporary directories
    fs.rmSync(tempDir, { recursive: true });

    res.send('Repository prepared successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error preparing repository');
  }
});

// API endpoint for handling test results
router.post('/results', (req, res) => {
    Test.setTestResults(req.body.testId, req.body.results)
    console.log('Test Results:', req.body.results);

    // Send a response
    res.status(200).send({ message: 'Test results received successfully.' });
});


export default router;