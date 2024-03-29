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
const rimraf = require('rimraf');
const readline = require('readline');
const { exec } = require('child_process');

// MulterRequest to prevent errors
interface MulterRequest extends express.Request {
    file: any;
    files: any;
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
    const projectsFolder = path.join(__dirname, 'upload', 'projects', Math.random().toString(36).slice(-8))
    const zipFilePath = req.body.project.path;

    const testsFolder = path.join(__dirname, 'upload', 'tests', Math.random().toString(36).slice(-8))
    const accessToken = req.user.gitea.accessToken.sha1
    const username = req.user.gitea.username

    // create repository
    await Gitea.createRepo(username, `${slug}-exam`, req.user.gitea.accessToken.sha1)
    await Gitea.createRepo(username, `${slug}-test`, req.user.gitea.accessToken.sha1)
    // { testsFile: file, tests: matches }
    fs.mkdirSync(testsFolder, { recursive: true })
    for (const test of req.body.tests) {
      fs.rename(test.testsFile.path, path.join(testsFolder, test.testsFile.originalname), function (err) {
        if (err) throw err
      })
    }

    // Initialize git repository in projects folder and commit changes
    try {
      await Gitea.commitPushRepo(`${username}/${slug}-test`, accessToken, testsFolder, req.user.email, req.user.displayName)
      console.log('Git repository reinitialized')
    } catch (error) {
      console.error('Error reinitializing Git repository:', error)
    }
    const rimrafRes = await rimraf(testsFolder);
    if (rimrafRes)
      console.log('Tests folder cleaned up');

    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: projectsFolder }))
      .on('close', async () => {
        exec('ls -la ' + projectsFolder, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}, stderr: ${stderr}`);
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

        const rimrafRes = await rimraf(projectsFolder);
        if (rimrafRes)
          console.log('Tests folder cleaned up');

        const exam = await Exam.createExam(req.body, req.user, slug);
        res.json({ exam, message: 'success' });
      });
  } catch (err) {
    next(err);
  }
});

router.post('/upload/project', upload.single('project'), async (req: any, res) => {
      res.json(req.file)
});

router.post('/upload/tests', upload.array('tests'), (req: MulterRequest, res, next) => {
  try {

    const files = req.files;
    const regex = /@Test/i;
    const javaRegexFunc = /void\s+(\w+)\s*\(/;
    const packageRegex = /package\s+([\w.]+)/;
    const classRegex = /(?:public\s+)?class\s+([\w]+)/;
    const testCasesPerFile = [];
    let packageMatch;
    let classMatch;

    let filesProcessed = 0;

    files.forEach((file) => {
      const matches = [];
      let getNextLine = false;
      let id = 1;

      const rl = readline.createInterface({
        input: fs.createReadStream(file.path),
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        const match = regex.exec(line);
        const m = javaRegexFunc.exec(line);

        const mpackageMatch = packageRegex.exec(line);
        const mclassMatch = classRegex.exec(line);

        if (mpackageMatch)
          packageMatch = mpackageMatch[1]

        if (mclassMatch)
          classMatch = mclassMatch[1]

        if (getNextLine && m) {
          const testName = m[1];
          matches.push({ id, name: `${testName}()` });
          id++;
        }
        if (match) {
          getNextLine = true;
        }
      });

      rl.on('close', () => {
        filesProcessed++;
        file['classname'] = `${packageMatch}.${classMatch}`
        testCasesPerFile.push({ testsFile: file, tests: matches });
        if (filesProcessed === files.length) {
          res.json({ files: testCasesPerFile });
        }
      });
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
    const exam = await Exam.deleteExam(req.params.id, req.user);
    res.json({exam, result: 'success'});
  } catch (err) {
    next(err);
  }
})

export default router;