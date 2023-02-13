// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import { generateSlug } from '../utils/slugify';

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  testRepo: {
    type: String,
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
}

interface ExamModel extends mongoose.Model<ExamDocument> {
  //getUserBySlug({ slug }: { slug: string }): Promise<ExamDocument>;

  getExamsByUser({ userId }: { userId: string }): Promise<ExamDocument[]>;

  updateExam({
    examId,
    name,
    pipelineId,
    templateId,
    subject,
    description,
    projectRepo,
    testRepo,
    slug,
    startsAt,
    endsAt,
  }: {
    examId: string;
    name: string,
    pipelineId: string,
    templateId: string,
    subject: string,
    description: string,
    projectRepo: string,
    testRepo: string,
    slug: string,
    startsAt: Date,
    endsAt: Date,
  }): Promise<ExamDocument[]>;

  createExam({
    examName,
    description,
    subject,
    startDate,
    endDate,
    project,
    tests,
    pipelineId,
    templateId,
    slug
  }: {
    examName: string,
    description: string,
    subject: string,
    startDate: Date,
    endDate: Date,
    project: string,
    tests: string,
    pipelineId: string,
    templateId: string,
    slug: string,
  }, user: Express.User): Promise<ExamDocument[]>;
}

class ExamClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async createExam(data, user) {
    console.log('Static method: createExam');

    //const slug = generateSlug()

    data = data['userId'] = user._id

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

examSchema.loadClass(ExamClass);

const Exam = mongoose.model<ExamDocument, ExamModel>('Exam', examSchema);

export default Exam;