/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import rimraf from 'rimraf';
import { generateSlug } from './../../utils/slugify';
import Pipeline from './../../models/Pipeline';
import Gitea from 'server/service-apis/gitea';
const multer = require('multer')
const fs = require('fs');
const path = require('path');

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
    const pipelinesFolder = path.join(__dirname, 'upload', 'pipelines', `${Math.random().toString(36).slice(-8)}`)
    const pipelineFilePath = req.body.file.path;
    const pipelineFile = pipelineFilePath.split('/').pop()
    const accessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN
    //const username = req.user.gitea.username

    // create repository
    await Gitea.createRepo('gitea_admin', `${slug}-pipeline`, accessToken)

    fs.mkdirSync(pipelinesFolder, { recursive: true })
    fs.rename(pipelineFilePath, `${pipelinesFolder}/${pipelineFile}`, function (err) {
      if (err) throw err
    })

    // Initialize git repository in projects folder and commit changes
    try {
      await Gitea.commitPushRepo(`gitea_admin/${slug}-pipeline`, accessToken, pipelinesFolder, req.user.email, req.user.displayName)
      console.log('Git repository reinitialized')
    } catch (error) {
      console.error('Error reinitializing Git repository:', error)
    }

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

router.post('/upload', upload.single('pipeline'), (req: MulterRequest, res) => {
    res.json(req.file);
});

export default router;