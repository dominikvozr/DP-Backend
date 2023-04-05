// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import async from 'async'
import { generateSlug } from '../utils/slugify';
//import Exam from './Exam';

interface Score {
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
    required: true,
  },
  endedAt: {
    type: Date,
    required: true,
  },
  score: {
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

  getTestById(id: string, user: any): Promise<TestDocument>;

  getTestByExamSlug(id: string, user: any): Promise<TestDocument>;

  updateTestResults(testId: string, results: Score): Promise<TestDocument>;

  createTest({
    userId,
    examId,
    testRepo,
    slug,
    startedAt,
    endedAt,
    score,
    isOpen,
  }: {
    userId: string,
    examId: string,
    testRepo: string,
    slug: string,
    startedAt: Date,
    endedAt: Date,
    score: Array<object>,
    isOpen: boolean,
  }, user: Express.User): Promise<TestDocument>;

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

  public static async getTestById(id: string, user: any) {
    const test = await this.findById(id).exec();
    if(test.userId == user.id)
      return test
    else
      return {status: 'forbidden', isAuthenticated: false}
  }

  public static async getTestByExamSlug(slug: string, user: any) {
    return await this.find({examSlug: slug, userId: user.id});
  }

  public static async createTest(data, user) {
    console.log('Static method: createTest');

    const slug = await generateSlug(this, data.name);

    data['user'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()

    const exam = await this.insertMany([data])
    return exam
  }

  public static async updateTestResults(testId, results: Score) {
    const test = await this.findById(testId);
    const dbResults = createResults(test, results)
    const modifier = { results: dbResults };
    return this.findByIdAndUpdate(testId, { $set: modifier }, { new: true, runValidators: true })
      .setOptions({ lean: true });
  }

}

function createResults(test: any, testResults) {
  const testArr = test.exam.tests
  let points = 0;

  testResults.forEach((result) => {
    if (result.result) {
      const test = testArr.find((test) => test.test_function_name === result.test_function_name + '()');
      if (test) {
        points += test.points;
      }
    }
    return {
        points,
        message: JSON.stringify(testResults),
        percentage: points / test.exam.points * 100,
        mark: '',
        time: new Date(),
    }
  });
}

testSchema.loadClass(TestClass);

const Test = mongoose.model<TestDocument, TestModel>('Test', testSchema);

export default Test;