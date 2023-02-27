// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify';

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  pipelineId: {
    type: String,
    required: true,
  },
  templateId: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  projectRepo: {
    type: String,
  },
  project: {
    type: Object,
  },
  testsRepo: {
    type: String,
  },
  testsFile: {
    type: Object,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  tests: [{
    id: String,
    name: String,
    points: Number,
  }],
  isOpen: Boolean
});

interface ExamDocument extends mongoose.Document {
  name: string,
  userId: string,
  pipelineId: string,
  templateId: string,
  subject: string,
  description: string,
  projectRepo: string,
  testRepo: string,
  slug: string,
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  points: number,
  tests: [{
    id: number,
    name: string,
    points: number,
  }],
  isOpen: boolean,
}

interface ExamModel extends mongoose.Model<ExamDocument> {
  //getUserBySlug({ slug }: { slug: string }): Promise<ExamDocument>;

  getExamsByUser({ userId }: { userId: string }): Promise<ExamDocument[]>;

  getExams(): Promise<ExamDocument[]>;

  updateExam({
    name,
    userId,
    pipelineId,
    templateId,
    subject,
    description,
    projectRepo,
    testRepo,
    slug,
    startDate,
    endDate,
    createdAt,
    points,
    tests,
  }: {
    name: string,
    userId: string,
    pipelineId: string,
    templateId: string,
    subject: string,
    description: string,
    projectRepo: string,
    testRepo: string,
    slug: string,
    startDate: Date,
    endDate: Date,
    createdAt: Date,
    points: number,
    tests: Array<object>,
  }): Promise<ExamDocument[]>;

  createExam({
    name,
    userId,
    pipelineId,
    templateId,
    subject,
    description,
    projectRepo,
    testRepo,
    slug,
    startDate,
    endDate,
    createdAt,
    points,
    tests,
  }: {
    name: string,
    userId: string,
    pipelineId: string,
    templateId: string,
    subject: string,
    description: string,
    projectRepo: string,
    testRepo: string,
    slug: string,
    startDate: Date,
    endDate: Date,
    createdAt: Date,
    points: number,
    tests: Array<object>,
  }, user: Express.User): Promise<ExamDocument[]>;
}

class ExamClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async getExams() {
    const exams = await this.find()
    return exams
  }

  public static async createExam(data, user) {
    console.log('Static method: createExam');
    console.log(data, user);

    const slug = await generateSlug(this, data.name);

    data['userId'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()
    data['isOpen'] = true

    data.startDate.replace(' ', 'T')
    data.startDate = new Date(data.startDate)
    data.endDate.replace(' ', 'T')
    data.endDate = new Date(data.endDate)

    const exam = await this.insertMany([data])
    return exam[0]
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

examSchema.loadClass(ExamClass);

const Exam = mongoose.model<ExamDocument, ExamModel>('Exam', examSchema);

export default Exam;