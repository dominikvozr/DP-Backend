/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
const git = require('simple-git');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();


/*
Body: { projectUrl: string, testsUrl: string }
*/
router.post('/prepare-repo', async (req, res) => {
  const jenkinsfilesDir = path.join(__dirname, 'uploads', 'jenkinsfiles');
  const tempDir = path.join(__dirname, 'temp');

  try {
    // Clone project repository
    await git().clone(req.body.projectUrl, tempDir);

    // Get tests.java file from the tests repository
    const testsRepo = await git().clone(req.body.testsUrl, path.join(tempDir, 'tests_repo'));
    const testsFilePath = path.join(tempDir, 'tests_repo', 'tests.java');
    const destinationTestsFilePath = path.join(tempDir, 'tests.java');
    fs.copyFileSync(testsFilePath, destinationTestsFilePath);

    // Copy a random Jenkinsfile from /uploads/jenkinsfiles
    const jenkinsfiles = fs.readdirSync(jenkinsfilesDir);
    const randomIndex = Math.floor(Math.random() * jenkinsfiles.length);
    const randomJenkinsfile = jenkinsfiles[randomIndex];
    const sourceJenkinsfilePath = path.join(jenkinsfilesDir, randomJenkinsfile);
    const destinationJenkinsfilePath = path.join(tempDir, 'Jenkinsfile');
    fs.copyFileSync(sourceJenkinsfilePath, destinationJenkinsfilePath);

    // Create a new branch, commit, and push changes to Gitea
    const projectRepo = git(tempDir);
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


export default router;