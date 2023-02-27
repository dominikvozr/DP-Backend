// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify';

const testSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  examId: {
    type: String,
    required: true,
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
  score: [{
    points: Number,
    message: String,
    percentage: Number,
    mark: String,
  }],
  isOpen: Boolean,
});

interface TestDocument extends mongoose.Document {
  userId: string,
  examId: string,
  testRepo: string,
  slug: string,
  startedAt: Date,
  endedAt: Date,
  score: [{
    points: number,
    message: string,
    percentage: number,
    mark: string,
  }],
  isOpen: boolean,
}

interface TestModel extends mongoose.Model<TestDocument> {
  //getUserBySlug({ slug }: { slug: string }): Promise<TestDocument>;

  getTestsByUser({ userId }: { userId: string }): Promise<TestDocument[]>;

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
  }): Promise<TestDocument[]>;

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
  }, user: Express.User): Promise<TestDocument[]>;
}

class TestClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');


    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async createTest(data, user) {
    console.log('Static method: createTest');
    console.log(data, user);

    const slug = await generateSlug(this, data.name);

    data['userId'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()

    const exam = await this.insertMany([data])
    return exam
  }

  public static async updateProfile({ userId, name, avatarUrl }) {
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
  }
}

testSchema.loadClass(TestClass);

const Test = mongoose.model<TestDocument, TestModel>('Test', testSchema);

export default Test;