/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import Test from './../../models/Test';
const git = require('simple-git');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { exec } = require('child_process');


/*
Body: {projectRepoUrl: string, testsRepoUrl: string, pipelinesRepoUrl: string, testId: string}
*/
router.post('/evaluate', async (req, res) => {
  const randomName = Math.random().toString(36).substring(2, 15);
  const tempDir = path.join(__dirname, randomName);

  try {
    // Clone project repository
    await git().clone(req.body.projectRepoUrl, tempDir);

    // Get tests.java file from the tests repository
    const testsRepo = await git().clone(req.body.testsRepoUrl, path.join(tempDir, 'tests_repo'));
    const testsFilePath = path.join(tempDir, 'tests_repo', 'tests.java');
    const destinationTestsFilePath = path.join(tempDir, 'tests.java');
    fs.copyFileSync(testsFilePath, destinationTestsFilePath);

    // Get Jenkinsfile from the pipelines repository
    const pipelinesRepo = await git().clone(req.body.pipelinesRepoUrl, path.join(tempDir, 'pipelines_repo'));
    const pipelinesFilePath = path.join(tempDir, 'pipelines_repo', 'Jenkinsfile');
    const destinationPipelinesFilePath = path.join(tempDir, 'Jenkinsfile');
    exec(`sed -i "s/\\[TEST_ID_HERE\\]/${req.body.testId}/g" ${destinationPipelinesFilePath}`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).send({ message: 'Error updating the Jenkinsfile.' });
        }
    });
    fs.copyFileSync(pipelinesFilePath, destinationPipelinesFilePath);

    // Create a new branch, commit, and push changes to Gitea
    const projectRepo = git(tempDir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
    await projectRepo.checkoutLocalBranch('test');
    await projectRepo.add('./*');
    await projectRepo.commit('Add tests.java and Jenkinsfile');
    await projectRepo.push('origin', 'test');

    // Clean up temporary directories
    fs.rmdirSync(tempDir, { recursive: true });

    res.send('Repository prepared successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error preparing repository');
  }
});

// API endpoint for handling test results
router.post('/results', (req, res) => {
    Test.updateTestResults(req.body.testId, req.body.results)
    console.log('Test Results:', req.body.results);

    // Send a response
    res.status(200).send({ message: 'Test results received successfully.' });
});


export default router;