/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
import * as express from 'express';
import rimraf from 'rimraf';
import Exam from './../../models/Exam';
//import { UserDocument } from 'server/models/User';
import Test from './../../models/Test';
const git = require('simple-git');
const router = express.Router();

router.post('/create', async (req: any, res, next) => {
  try {
    // create repository
    const accessToken = req.body.user.gitea.accessToken.sha1 // ${req.user.gitea.accessToken.sha1}
    const repoName = `${req.body.exam.user.gitea.username}/${req.body.examSlug}-exam` // ${req.body.exam.user.gitea.username}
    const studentRepoName = `${req.user.gitea.username}/${req.body.examSlug}-student` // ${req.exam.user.gitea.username}
    const studentAccessToken = req.user.gitea.accessToken.sha1 // ${req.user.gitea.accessToken.sha1}
    const examRepoResponse = await axios.post(`${process.env.GITEA_URL}/api/v1/user/repos`,
    {
      name: `${req.body.examSlug}-student`,
      private: true,
      default_branch: "master",
    },
    {
      headers: {
        Authorization: `token ${studentAccessToken}`
      }
    });
    if (examRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    const tempDir = Math.random().toString(36).substring(2, 15);
    const clone = await git().clone(`http://${accessToken}@bawix.xyz:81/gitea/${repoName}.git`, tempDir);
    console.log(clone);

    const projectRepo = await git(tempDir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
    await projectRepo.add('./*')
    await projectRepo.commit('Initial commit')
    const gitExamRes = await projectRepo.push(`http://${studentAccessToken}@bawix.xyz:81/gitea/${studentRepoName}.git`, 'master');
    console.log(gitExamRes, 'Changes committed to GitHub');
    const rimrafRes = await rimraf(tempDir);
    if(rimrafRes)
      console.log('Projects folder cleaned up');

    const test = await Test.createTest(req.body, req.body.user);
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

/* router.get('/update/:id', async (req, res, next) => {
  try {
    const result = await Test.updateTest(req.params.id, req.user);
    console.log(result);
    res.json({result: 'success'});
  } catch (err) {
    next(err);
  }
})

router.get('/delete/:id', async (req, res, next) => {
  try {
    const result = await Test.deleteTest(req.params.id, req.user);
    console.log(result);
    res.json({result: 'success'});
  } catch (err) {
    next(err);
  }
}) */

export default router;