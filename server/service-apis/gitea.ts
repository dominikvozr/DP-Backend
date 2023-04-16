/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";
const fs = require('fs-extra');
const path = require('path');
const git = require('simple-git');
const { exec } = require('child_process');

export default class Gitea {

  public static createRepo = async (repo: string, token: string) => {
    try {
      const examRepoResponse = await axios.post(`${process.env.GITEA_URL}/api/v1/user/repos`, {
        name: repo,
        private: true,
        default_branch: "master",
      },
      {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return examRepoResponse
    } catch (err) {
      return err.response
    }
  }

  public static cloneRepoIntoDir = async (repo: string, token: string, dir: string) => {
    try {
      await git().clone(`http://${token}@bawix.xyz:81/gitea/${repo}.git`, dir);
      return 'success'
    } catch (err) {
      return err.response
    }
  }

  public static commitPushRepo = async (repo: string, token: string, dir: string, _branch: string) => {
    try {
      const git = await this.reinitializeRepo(dir, 'studentcode@studentcode.sk', 'studentcode')
      // const projectRepo = await git(dir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
      await git.add(['-f', '.'])
      await git.commit('Initial commit')
      await git.addRemote('newRemote', `http://${token}@bawix.xyz:81/gitea/${repo}.git`);
      await git.push(['--all', '--force', 'newRemote']);
      await git.pushTags('newRemote');
      return 'success'
    } catch (err) {
      console.log(err);

      return err.response
    }
  }

  public static reinitializeRepo = async(projectsFolder, email, name) => {
    // Check if .git folder exists
    const gitFolderPath = path.join(projectsFolder, '.git');
    const gitFolderExists = await fs.pathExists(gitFolderPath);
    console.log('reinitializeRepo function');
    console.log(gitFolderPath, gitFolderExists);

    if (gitFolderExists) {
        // Delete the existing .git folder
        await fs.remove(gitFolderPath);
        console.log('.git folder daleted');
    } else {
        console.log('.git folder not found, proceeding to initialize the repository');
    }

    // Initialize a new Git repository
    const gitRepo = git(projectsFolder, { config: [`user.email=${email}`, `user.name=${name}`] });
    await gitRepo.init();
    console.log('initialized git');
    return gitRepo;
  }

  public static prepareTests = async (repo: string, token: string, destinationDir: string) => {
    try {
      const testsPath = path.join(destinationDir, 'tests_repo')
      await git().clone(`http://${token}@bawix.xyz:81/gitea/${repo}.git`, testsPath);
        const sourceDir = testsPath;
        fs.readdir(sourceDir, (err, files) => {
        if (err) throw err;
        files.forEach(file => {
          if (file.startsWith('tests')) {
            const sourceFilePath = path.join(sourceDir, file);
            const destinationFilePath = path.join(destinationDir, file);
            fs.copyFileSync(sourceFilePath, destinationFilePath);
            console.log(`${sourceFilePath} copied to ${destinationFilePath}`);
          }
        });
      });
    } catch (err) {
      return err.response
    }
  }

  public static preparePipeline = async (repo: string, studentRepo: string, token: string, destinationDir: string, testId: string) => {
    try {
      const pipelinePath = path.join(destinationDir, 'pipelines_repo');
      await git().clone(`http://${token}@bawix.xyz:81/gitea/gitea_admin/${repo}.git`, pipelinePath);
      const pipelinesFilePath = path.join(pipelinePath, 'Jenkinsfile');
      const destinationPipelinesFilePath = path.join(destinationDir, 'Jenkinsfile');
      fs.copyFileSync(pipelinesFilePath, destinationPipelinesFilePath);
      exec(`sed -i '' "s/\\[TEST_ID_HERE\\]/${testId}/g" ${destinationPipelinesFilePath}`, (err) => {
          if (err) {
            throw new Error(err);
          }
      });
      exec(`sed -i '' "s/\\[REPO_NAME_HERE\\]/${studentRepo}/g" ${destinationPipelinesFilePath}`, (err) => {
          if (err) {
            throw new Error(err);
          }
      });
    } catch (err) {
      return err.response
    }
  }
}