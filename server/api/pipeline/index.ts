/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
import * as express from 'express';
import rimraf from 'rimraf';
import { generateSlug } from './../../utils/slugify';
import simpleGit from 'simple-git';
//import { UserDocument } from 'server/models/User';
import Pipeline from './../../models/Pipeline';
const multer = require('multer')
const fs = require('fs');



// MulterRequest to prevent errors
interface MulterRequest extends express.Request {
    file: any;
}

// Multer storage initialization
const storage = multer.diskStorage({
  destination: 'upload/pipelines/',
  filename: (_req, _file, callback) => {
    callback(null, 'Jenkinsfile');
  },
});
const upload = multer({ storage: storage }) // for parsing multipart/form-data
const router = express.Router();


router.post('/create', async (req: any, res, next) => {
  try {
    const slug = await generateSlug(Pipeline, req.body.name);
    const defaultBranch = 'master'
    const pipelinesFolder = `upload/pipelines/${Math.random().toString(36).slice(-8)}`
    const pipelineFilePath = req.body.file.path;
    const pipelineFile = pipelineFilePath.split('/').pop()
    const accessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN
    //const username = req.user.gitea.username

    // create repository
    const pipelineRepoResponse = await axios.post(`${process.env.GITEA_URL}/api/v1/user/repos`,
    {
      name: `${slug}-pipeline`,
      private: true,
      default_branch: defaultBranch,
    },
    {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });
    console.log(pipelineRepoResponse);
    if (pipelineRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    fs.mkdirSync(pipelinesFolder, { recursive: true })
    fs.rename(pipelineFilePath, `${pipelinesFolder}/${pipelineFile}`, function (err) {
      if (err) throw err
    })

    // Initialize git repository in projects folder and commit changes
    const git = simpleGit(pipelinesFolder, { config: [`user.email=${req.user.email}`, `user.name=${req.user.displayName}`] });
    await git.init()
    await git.add('./*')
    await git.commit('Initial commit')
    // Push the changes
    const gitPipelineRes = await git.push(`http://${accessToken}@bawix.xyz:81/gitea/gitea_admin/${slug}-pipeline.git`, defaultBranch);//${username}
    console.log(gitPipelineRes, 'Changes committed to GitHub');
    const rimrafRes = await rimraf(pipelinesFolder);
      if(rimrafRes)
        console.log('Projects folder cleaned up');

    const pipeline = await Pipeline.createPipeline(req.body, req.user, slug);
    res.json({pipeline, message: 'success'});
  } catch (err) {
    next(err);
  }
})

router.get('/index', async (req, res, next) => {
  try {
    const pipelines = await Pipeline.getPipelines();
    res.json({user: req.user, pipelines, isAuthorized: true});
  } catch (err) {
    next(err);
  }
})

router.post('/upload', upload.single('pipeline'), (req: MulterRequest, res, next) => {
  try {
    /* if (req.file && req.file.name.toLowerCase().includes('jenkinsfile'))
      throw new Error("file is not Jenkinsfile"); */

    res.json(req.file);
  } catch (err) {
    next(err);
  }
});

export default router;