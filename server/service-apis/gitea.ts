/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";
import * as util from 'util';
import * as child_process from 'child_process';
const fs = require('fs-extra');
const path = require('path');
const git = require('simple-git');
const exec = util.promisify(child_process.exec);

export default class Gitea {

  public static createRepo = async (username: string, repo: string, token: string) => {
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
      try {
        await axios.delete(`${process.env.GITEA_URL}/api/v1/repos/${username}/${repo}`,
        {
          headers: {
            Authorization: `token ${process.env.GITEA_ADMIN_ACCESS_TOKEN}`
          }
        });
        await this.createRepo(username, repo, token)
      } catch (error) {
        console.error(error);
        console.error(err)
        return err.response
      }
    }
  }

  public static cloneAdminRepoIntoDir = async (repo: string, dir: string) => {
    try {
      await git().clone(`http://${process.env.GITEA_ADMIN_ACCESS_TOKEN}@bawix.xyz:81/gitea/${repo}.git`, dir);
      return 'success'
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

  public static commitPushRepo = async (repo: string, token: string, dir: string, email: string, displayName: string) => {
    try {
      const git = await this.reinitializeRepo(dir, email, displayName)
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
      fs.rmSync(path.join(testsPath, '.git'), { recursive: true });
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
      /* await exec(`sed -i '' "s/\\[TEST_ID_HERE\\]/${testId}/g" ${destinationPipelinesFilePath}`);
      await exec(`sed -i '' "s/\\[REPO_NAME_HERE\\]/${studentRepo}/g" ${destinationPipelinesFilePath}`); */
      try {
        await exec(sedCommand('\\[TEST_ID_HERE\\]', testId, destinationPipelinesFilePath));
      } catch (error) {
        console.error('Error in updating TEST_ID_HERE:', error);
        throw error;
      }

      try {
        await exec(sedCommand('\\[REPO_NAME_HERE\\]', studentRepo, destinationPipelinesFilePath));
      } catch (error) {
        console.error('Error in updating REPO_NAME_HERE:', error);
        throw error;
      }
      fs.rmSync(pipelinePath, { recursive: true });
    } catch (err) {
      console.error('Error in preparePipeline:', err);
      return err.response
    }
  }
}

function sedCommand(searchPattern, replacement, filePath) {
    const platform = process.platform;
    const isMac = platform === 'darwin';
    const sedFlag = isMac ? "-i ''" : '-i';

    // Convert the replacement to a string
    replacement = replacement.toString();

    // Escape forward slashes in the replacement string for Linux systems
    if (!isMac) {
      replacement = replacement.replace(/\//g, '\\/');
    }

    return `sed ${sedFlag} "s/${searchPattern}/${replacement}/g" ${filePath}`;
};