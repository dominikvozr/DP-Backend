/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import rimraf from 'rimraf';
import Exam from './../../models/Exam';
import Test from './../../models/Test';
import Gitea from '../../service-apis/gitea';
import { generateSlug } from './../../utils/slugify';
import * as console from "console";
const path = require('path');
const router = express.Router();


/* REQUEST BODY
{
  "user": {"_id": "642a801b4dfb0003a1ed1fa9"},
  "exam": {"_id": "64370e273441f6e96ab0869e"},
}
*/
router.post('/create', async (req: any, res, next) => {
  let exam
  try {
    // create repository
    exam = await Exam.findById(req.body.examId).populate('user')
  } catch (error) {
    console.error(error)
    next(error)
  }

  if (!exam) next('exam not found!')
  const slug = await generateSlug(Test, exam.slug);
  const examRepoName = `${exam.user.gitea.username}/${exam.slug}-exam` // ${req.body.exam.user.gitea.username}
  const studentRepoName = `${req.user.gitea.username}/${slug}-student` // ${req.exam.user.gitea.username}
  const studentAccessToken = req.user.gitea.accessToken.sha1 // ${req.user.gitea.accessToken.sha1}
  await Gitea.createRepo(req.user.gitea.username, `${slug}-student`, studentAccessToken)
  try {
    console.log("create temp dir for repo")
    const tempDir = path.join(__dirname, Math.random().toString(36).substring(2, 15))
    console.log("clone professor repo into tempDir")
    await Gitea.cloneAdminRepoIntoDir(examRepoName, tempDir)
    console.log("commit and push repo to students repo")
    await Gitea.commitPushRepo(studentRepoName, studentAccessToken, tempDir, 'studentcode@studentcode.com', 'StudentCODE')
    console.log("delete project")
    await rimraf(tempDir);
    console.log("create test")
    const test = await Test.createTest(exam, req.user, slug);
    console.log("added to db")
    res.json({test, message: 'success'});
  } catch (err) {
    next(err);
  }
});

router.get('/index', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page.toString())
    const { tests, testsCount }: { tests: object[], testsCount: number } = await Test.getTests(req.user, page);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, tests, testsCount});
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