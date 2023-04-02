import * as express from 'express';
//import { UserDocument } from 'server/models/User';
import Pipeline from './../../models/Pipeline';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer')


// MulterRequest to prevent errors
interface MulterRequest extends express.Request {
    file: any;
}

// Multer storage initialization
const storage = multer.diskStorage({
  destination: 'upload/pipelines/',
  filename: (_req, _file, callback) => {
    const randomName = Math.random().toString(36).substring(2, 15);
    callback(null, randomName);
  },
});
const upload = multer({ storage: storage }) // for parsing multipart/form-data
const router = express.Router();


router.post('/create', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.createPipeline(req.body, req.user);
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