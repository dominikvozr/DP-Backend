// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import async from 'async'
import Exam from './Exam';
import { isEmpty } from 'lodash';
import Event from './Event';

interface Score {
    tests: [],
    points: number,
    message: string,
    percentage: number,
    mark: string,
    time: Date,
}

const testSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  examSlug: {
    type: String,
  },
  testRepo: {
    type: String,
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  reports: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
  ],
  score: {
    tests: [{
      file: String,
      tests:[{
        name: String,
        classname: String,
        failure: String,
        value: {
          type: Number,
          default: 0,
        },
        passed: Boolean,
      }]
    }],
    points: Number,
    message: String,
    percentage: Number,
    mark: String,
    time: Date,
  },
  isOpen: Boolean,
});

interface TestDocument extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId,
  exam: mongoose.Schema.Types.ObjectId,
  examSlug: string,
  testRepo: string,
  slug: string,
  startedAt: Date,
  endedAt: Date,
  score: {
    tests: [{
      file: String,
      tests: [{
        name: string,
        classname: string,
        failure: string,
        value: number,
        passed: boolean,
      }]
    }],
  isOpen: boolean,
}

interface TestModel extends mongoose.Model<TestDocument> {
  getTestsByUser({ userId }: { userId: string }): Promise<TestDocument[]>;

  getTests(user: any): Promise<TestDocument[]>;

  getTestsByExam(examId: string, user: any): Promise<TestDocument[]>;

  getTestById(id: string, user: any): Promise<TestDocument>;

  getAdminTestById(id: string): Promise<TestDocument>;

  getTestByExamSlug(id: string, user: any): Promise<TestDocument>;

  updateTestResults(testId: string, testScore: Score, user: any): Promise<TestDocument>;

  setTestResults(testId: string, results: Score): Promise<TestDocument>;

  createTest(exam: typeof Exam, user: Express.User, slug: string): Promise<TestDocument>;

  checkIfExist(exam: typeof Exam, user: Express.User): Promise<TestDocument>;

  deleteTest({
    id
  }: {
    id: string
  }, user: Express.User): Promise<TestDocument>;
}

class TestClass extends mongoose.Model {
  public static async getTests(user: any) {
    const exams = await this.find({ 'user': user._id })
      .populate('user')
      .populate('exam')
      .sort({ startedAt: 'desc' })
    return exams
  }

  public static async getTestById(id: string, _user: any) {
    const test = await this.findById(id)
      .populate({
        path: 'exam',
        populate: [
          {path: 'user'},
          {path: 'pipeline'}
        ],
      })
      .populate('user')
      .exec();
    /* if(test.userId == user.id)
      return test
    else
      return {status: 'forbidden', isAuthenticated: false} */
      return test
  }

  public static async getAdminTestById(id: string) {
    const test = await this.findById(id)
      .populate({
        path: 'exam',
        populate: [
          {path: 'user'},
          {path: 'pipeline'}
        ],
      })
      .populate('user')
      .exec();
      return test
  }

  public static async getTestsByExam(examId: string, user: any) {
    const tests = await this.find({ exam: examId, user: user._id }).populate('user').populate({
      path: 'reports',
      match: { isOpen: true },
    });
    return tests
  }

  public static async getTestByExamSlug(slug: string, user: any) {
    return await this.findOne({examSlug: slug, user: user._id})
      .populate('reports')
      .populate({
        path: 'exam',
        populate: [
          { path: 'user' },
        ],
      });;
  }

  public static async checkIfExists(exam, user) {
    console.log('Checking if test with same id exist in user');
    const resp = await this.find({user: user._id, exam: exam._id})
    console.log(resp);
    if(!isEmpty(resp)) return true
    return false
  }

  public static async createTest(exam, user, slug) {
    // TODO uncomment code below in production
    const checked = await this.checkIfExists(exam, user)
    if (checked) {
      console.error('test already exists');
      throw Error('test already exists')
    }
    const data = {
      user: user._id,
      exam: exam._id,
      examSlug: exam.slug,
      testRepo: `${user.gitea.username}/${slug}-student`,
      slug: slug,
      startedAt: new Date(),
      isOpen: true,
    }
    const test = new Test(data)
    test.save(function(err) {
      if (err) console.log(err);
    });
    Event.createEvent({
      userId: exam.user._id,
      fromUser: user._id,
      name: `${user.displayName}`,
      description: `has logged in to your exam ${exam.name}.`,
      link: `professor/exam/${exam.id}/`,
      type: 'testCreate',
    });
    return test
  }

  public static async updateTestResults(testId, testScore: any, user: any) {
    const test = await this.findById(testId).populate({
      path: 'exam',
      populate: [
        { path: 'user' },
      ],
    });
    if (test.exam.user.id !== user.id) return 'forbidden'

    let points = 0
    const tests = test.score.tests

    for (const [index, testFile] of tests.entries()) {
      for (const [idx, _tt] of testFile.tests.entries()) {
        if (testScore[index] && testScore[index][idx]) {
          tests[index].tests[idx].value = parseInt(testScore[index][idx])
          tests[index].tests[idx].passed = tests[index].tests[idx].value > 0
        }
        points += tests[index].tests[idx].value
      }
    }

    test.score.points = points;
    test.score.percentage = (points / test.exam.points) * 100;
    test.score.tests = tests
    test.save();

    Event.createEvent({
      userId: test.user._id,
      fromUser: user._id,
      name: `Evaluation changed`,
      description: `${user.displayName} changed your evaluation.`,
      link: `student/test/${test.slug}`,
      type: 'evaluationChanged',
    });
    return test
    /* return this.findByIdAndUpdate(testId, { $set: modifier }, { new: true, runValidators: true })
      .setOptions({ lean: true }); */
  }

  public static async setTestResults(testId: string, results: any) {
    const test = await this.getTestById(testId, null);
    const dbResults = []
    let mainPoints = 0

    for (const result of results) {
      const { testResults, points } = createResults(test, result)
      dbResults.push({file: result.file, tests: testResults})
      mainPoints += points
    }

    const score = {
      tests: dbResults,
      message: JSON.stringify(dbResults),
      points: mainPoints,
      percentage: (mainPoints / test.exam.points * 100).toFixed(2),
      mark: '',
      time: new Date(),
    }

    const modifier = { score, isOpen: false };
    const updatedTest = await this.findByIdAndUpdate(testId, { $set: modifier }, { new: true, runValidators: true })
      .setOptions({ lean: true });
    Event.createEvent({
      userId: test.user._id,
      name: `Test evaluation ended`,
      description: `${test.user.displayName}, your test (${test.exam.name}) evaluation has ended.`,
      link: `student/test/${test.slug}/`,
      type: 'evaluationEnded',
    });
    return updatedTest
  }
}

function findTests(tests: any, classname: string) {
  for (const test of tests) {
    if (test.testsFile.classname === classname) {
      return test
    }
  }
  throw new Error("tests by classname were not found!");
}

function createResults (test: any, testResults: any): { testResults: { tests: { name: string, points: number }[], testsFile: object }, points: number } {
  let testArr: { tests: { name: string, points: number }[], testsFile: object };
  try {
    testArr = findTests(test.exam.tests, testResults.classname)
  } catch (error) {
    console.error('error while catching tests array: ' + error)
  }
  let points = 0;

  testResults = testResults.tests.map((result: any) => {
    if (result.failure) {
      result['value'] = 0
      return result
    }

    const test: { name: string, points: number } = testArr.tests.find((tt: { name: string }) => tt.name == result.name) //testArr[index];
    if (!test)
      throw new Error(`Unable to find test name: '${result.name}' while evaluating`)

    points += test.points;
    result['value'] = test.points
    return result
  });
  return {
    testResults,
    points
  }
}

testSchema.loadClass(TestClass);

const Test = mongoose.model<TestDocument, TestModel>('Test', testSchema);

export default Test;