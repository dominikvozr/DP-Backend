/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import rimraf from 'rimraf';
import Exam from './../../models/Exam';
import Test from './../../models/Test';
import User from './../../models/User';
import Gitea from '../../service-apis/gitea';
import { generateSlug } from './../../utils/slugify';
const path = require('path');
const router = express.Router();


/* REQUEST BODY
{
  "user": {"_id": "642a801b4dfb0003a1ed1fa9"},
  "exam": {"_id": "64370e273441f6e96ab0869e"},
}
*/
router.post('/create', async (req: any, res, next) => {
  // create repository
  const user: any = await User.findById(req.body.user._id)
  const exam: any = await Exam.findById(req.body.exam._id).populate('user')
  const slug = await generateSlug(Test, exam.slug);
  const accessToken = user.gitea.accessToken.sha1 // ${req.user.gitea.accessToken.sha1}
  const examRepoName = `${exam.user.gitea.username}/${exam.slug}-exam` // ${req.body.exam.user.gitea.username}
  const studentRepoName = `${user.gitea.username}/${slug}-student` // ${req.exam.user.gitea.username}
  const studentAccessToken = user.gitea.accessToken.sha1 // ${req.user.gitea.accessToken.sha1}
  const response = await Gitea.createRepo(user.gitea.username, `${slug}-student`, studentAccessToken)
  // repository already exists
  if (response.status === 409) {}
  try {
    // create temp dir for repo
    const tempDir = path.join(__dirname, Math.random().toString(36).substring(2, 15))
    // clone professor repo into tempDir
    await Gitea.cloneRepoIntoDir(examRepoName, accessToken, tempDir)
    // commit and push repo to students repo
    await Gitea.commitPushRepo(studentRepoName, studentAccessToken, tempDir, 'studentcode@studentcode.com', 'StudentCODE')
    // delete projectb
    await rimraf(tempDir);
    // create test
    const test = await Test.createTest(exam, user, slug);
    res.json({test, message: 'success'});
  } catch (err) {
    next(err);
  }
});

router.get('/index', async (req, res, next) => {
  try {
    const tests = await Test.getTests(req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, tests});
  } catch (err) {
    next(err);
  }
})

router.get('/show/:id', async (req: any, res, next) => {
  try {
    const test = await Test.getTestById(req.params.id, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, test});
  } catch (err) {
    next(err);
  }
})

router.get('/exam/:slug', async (req, res, next) => {
  try {
    const test = await Test.getTestByExamSlug(req.params.slug, req.user);
    const exam = await Exam.getExamBySlug(req.params.slug, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, test, exam});
  } catch (err) {
    next(err);
  }
})

router.put('/update/score/:id', async (req, res, next) => {
  try {
    const result = await Test.updateTestResults(req.params.id, req.body, req.user);
    res.json({result, message: 'success'});
  } catch (err) {
    next(err);
  }
})

export default router;