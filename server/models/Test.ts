// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import async from 'async'
import { generateSlug } from '../utils/slugify';
//import Exam from './Exam';

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

  updateTest({
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
  }): Promise<TestDocument>;

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
    console.log(data, user);

    const slug = await generateSlug(this, data.name);

    data['user'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()

    const exam = await this.insertMany([data])
    return exam
  }

  /* public static async updateTest({ userId, name, avatarUrl }) {
    console.log('Static method: updateProfile');

    const user = await this.findById(userId, 'slug displayName');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    console.log(user.slug);

    if (name !== user.displayName) {
      modifier.displayName = name;
     // modifier.slug = await generateSlug(this, name);
    }

    return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  } */
}

testSchema.loadClass(TestClass);

const Test = mongoose.model<TestDocument, TestModel>('Test', testSchema);

export default Test;