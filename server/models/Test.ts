// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import async from 'async'
import Exam from './Exam';
import { isEmpty } from 'lodash';
//import Exam from './Exam';

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
  score: {
    tests: Array,
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
    tests: [],
    points: number,
    message: string,
    percentage: number,
    mark: string,
    time: Date,
  },
  isOpen: boolean,
}

interface TestModel extends mongoose.Model<TestDocument> {
  getTestsByUser({ userId }: { userId: string }): Promise<TestDocument[]>;

  getTests(user: any): Promise<TestDocument[]>;

  getTestsByExam(examId: string, user: any): Promise<TestDocument[]>;

  getTestById(id: string, user: any): Promise<TestDocument>;

  getAdminTestById(id: string): Promise<TestDocument>;

  getTestByExamSlug(id: string, user: any): Promise<TestDocument>;

  updateTestResults(testId: string, results: Score, user: any): Promise<TestDocument>;

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
    const exams = await this.find({'user': user._id}).populate('user')
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
      console.log(test);

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
    const test = await this.find({exam: examId, user: user._id}).populate('user');
    return test
  }

  public static async getTestByExamSlug(slug: string, user: any) {
    return await this.find({examSlug: slug, userId: user.id});
  }

  public static async checkIfExists(exam, user) {
    console.log('Checking if test with same id exist in user');
    const resp = await this.find({user: user._id, exam: exam._id})
    console.log(resp);
    if(!isEmpty(resp)) return true
    return false
  }

  public static async createTest(exam, user, slug) {
    console.log('Static method: createTest');
    // TODO uncomment code below in production
    /* const checked = await this.checkIfExists(exam, user)
    if (checked) {
      console.error('test already exists');
      throw Error('test already exists')
    } */
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
    return test
  }

  public static async updateTestResults(testId, results: Score, user: any) {
    const test = await this.findById(testId).populate('user');
    if (test.user._id !== user._id) return 'forbidden'
    const modifier = { score: results };
    return this.findByIdAndUpdate(testId, { $set: modifier }, { new: true, runValidators: true })
      .setOptions({ lean: true });
  }

  public static async setTestResults(testId: string, results: Score) {
    const test = await this.getTestById(testId, null);
    const dbResults = createResults(test, results)
    const modifier = { score: dbResults, isOpen: false };
    return this.findByIdAndUpdate(testId, { $set: modifier }, { new: true, runValidators: true })
      .setOptions({ lean: true });
  }

}

function createResults(test: any, testResults) {
  const testArr = test.exam.tests
  let points = 0;

  testResults.map((result, index) => {
    if (!result.result){
      testResults[index].value = 0
      return
    }

    const test = testArr[index];
    if (!test)
      throw new Error(`Unable to find test name: '${result.name}' while evaluating`)

      points += test.points;
      testResults[index].value = test.points
  });
  return {
      tests: testResults,
      points,
      message: JSON.stringify(testResults),
      percentage: points / test.exam.points * 100,
      mark: '',
      time: new Date(),
  }
}

testSchema.loadClass(TestClass);

const Test = mongoose.model<TestDocument, TestModel>('Test', testSchema);

export default Test;