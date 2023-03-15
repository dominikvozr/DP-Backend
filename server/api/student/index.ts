import * as express from 'express';
import Exam from './../../models/Exam';
//import { UserDocument } from 'server/models/User';
import Test from './../../models/Test';

const router = express.Router();

router.post('/create', async (req: express.Request, res, next) => {
  try {
    const test = await Test.createTest(req.body, req.user);
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

router.get('/show/:id', async (req, res, next) => {
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