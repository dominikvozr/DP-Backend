/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import { generateSlug } from '../../utils/slugify';
import Exam from './../../models/Exam';
import Test from './../../models/Test';
import Gitea from './../../service-apis/gitea';
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer')
const unzipper = require('unzipper');
const simpleGit = require('simple-git');
const rimraf = require('rimraf');
const readline = require('readline');
const { exec } = require('child_process');
//const { Readable } = require('stream');


// MulterRequest to prevent errors
interface MulterRequest extends express.Request {
    file: any;
}

interface IndexRequest extends express.Request {
    page: string;
}

// Multer storage initialization
const storage = multer.diskStorage({
  destination: 'upload/test/',
  filename: (_req, file, callback) => {
    const originalName = file.originalname;
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const randomName = Math.random().toString(36).slice(-8);
    callback(null, randomName + extension);
  },
});
const upload = multer({ storage: storage}) // for parsing multipart/form-data
const router = express.Router();

router.post('/create', async (req: any, res, next) => {
  try {
    const slug = await generateSlug(Exam, req.body.name);
    const defaultBranch = 'master'
    const projectsFolder = path.join(__dirname, 'upload', 'projects', Math.random().toString(36).slice(-8))
    const testsFolder = `upload/tests/${Math.random().toString(36).slice(-8)}`
    const zipFilePath = req.body.project.path;
    const testFilePath = req.body.testsFile.path;
    const extension = testFilePath.split('/').pop().split('.')[1]
    const accessToken = req.user.gitea.accessToken.sha1
    const username = req.user.gitea.username

    // create repository
    await Gitea.createRepo(username, `${slug}-exam`, req.user.gitea.accessToken.sha1)
    await Gitea.createRepo(username, `${slug}-test`, req.user.gitea.accessToken.sha1)

    fs.mkdirSync(testsFolder, { recursive: true })
    fs.rename(testFilePath, `${testsFolder}/tests.${extension}`, function (err) {
      if (err) throw err
    })

    // Initialize git repository in projects folder and commit changes
    const git = simpleGit(testsFolder, { config: [`user.email=${req.user.email}`, `user.name=${req.user.displayName}`] });
    await git.init()
    await git.add('./*')
    await git.commit('Initial commit')
    await git.push(`http://${accessToken}@bawix.xyz:81/gitea/${username}/${slug}-test.git`, defaultBranch);
    const rimrafRes = await rimraf(testsFolder);
      if(rimrafRes)
        console.log('Tests folder cleaned up');

    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: projectsFolder }))
      .on('finish', async () => {
        exec('ls -la ' + projectsFolder, (error, stdout, _stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
          }
          console.log('stdout: ' + stdout);
        });
        console.log('Zip file extracted successfully');
        try {
          await Gitea.commitPushRepo(`${username}/${slug}-exam`, accessToken, projectsFolder, req.user.email, req.user.displayName)
          console.log('Git repository reinitialized')
        } catch (error) {
          console.error('Error reinitializing Git repository:', error)
        }

        const exam = await Exam.createExam(req.body, req.user, slug);
        res.json({exam, message: 'success'});
      });
  } catch (err) {
    next(err);
  }
});

router.post('/upload/project', upload.single('project'), async (req: any, res) => {
      res.json(req.file)
});

router.post('/upload/tests', upload.single('tests'), (req: MulterRequest, res, next) => {
  try {
    const file = req.file;
    const regex = /@Test/i;
    const javaRegexFunc = /void\s+(\w+)\s*\(/;
    /* const pythonRegexFunc = /@pytest\.mark\.parametrize\(['"](.*)['"]/gm;
    const jsRegexFunc = /@Test\s+void\s+(\w+)\s*\(/gm;
    const cRegexFunc = /void\s+(\w+)\s*\(/gm;
    const cppRegexFunc = /void\s+(\w+)::test\s*\(/gm; */
    const matches = [];
    let getNextLine = false;
    let id = 1;

    const rl = readline.createInterface({
      input: fs.createReadStream(file.path),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {

      const match = regex.exec(line);
      const m = javaRegexFunc.exec(line) //|| pythonRegexFunc.exec(line) || jsRegexFunc.exec(line) || cRegexFunc.exec(line) || cppRegexFunc.exec(line);

      if (getNextLine && m){
        const testName = m[1];
        matches.push({ id, name: `${testName}()` });
        id++;
      }
      if (match)
        getNextLine = true;
    });

    rl.on('close', () => {
      res.json({ file, matches });
    });
  } catch (err) {
    next(err);
  }
});

router.get('/index', async (req: IndexRequest, res, next) => {
  try {
    const page = parseInt(req.query.page.toString())
    const data = await Exam.getExams(req.user, page);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, data});
  } catch (err) {
    next(err);
  }
})

router.get('/show/:id', async (req, res, next) => {
  try {
    console.log(req.params.id);
    const exam = await Exam.getExam(req.params.id, req.user);
    const tests = await Test.getTestsByExam(req.params.id, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, exam, tests});
  } catch (err) {
    next(err);
  }
})

router.get('/get', async (req, res, next) => {
  try {
    const exam = await Exam.getExamBySlug(req.query.test as string, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, exam});
  } catch (err) {
    next(err);
  }
})

router.get('/delete/:id', async (req, res, next) => {
  try {
    const result = await Exam.deleteExam(req.params.id, req.user);
    console.log(result);
    res.json({result: 'success'});
  } catch (err) {
    next(err);
  }
})

export default router;