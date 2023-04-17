// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import Scheduler from './../scheduler/scheduler';
import DateTimeService from './../service-apis/dateTimeService';

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pipeline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pipeline",
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
  user: mongoose.Schema.Types.ObjectId,
  pipeline: mongoose.Schema.Types.ObjectId,
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
  getExamsByUser({ userId }: { userId: string }): Promise<ExamDocument[]>;

  getExams(user: any, page: number): Promise<ExamDocument[]>;

  getExam(id : string, user: any): Promise<ExamDocument>;

  getExamBySlug(slug : string, user: any): Promise<ExamDocument>;

  deleteExam(id:string , user: any);

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

  createExam(data: ExamDocument, user: Express.User, slug: string, ip: string): Promise<ExamDocument[]>;
}

class ExamClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async getExams(user: any, page: number | null) {
    const limit = 8
    const skip = page ? (page-1) * limit : 0
    const examsCount = await this.count()
    const exams = await this.find({'user': user._id})
      .sort({createdAt: 'desc'})
      .skip(skip)
      .limit(limit)
    return { exams, examsCount }
  }

  public static async getExam(id : string, user: any) {
    const exam = await this
      .findById(id)
      .populate('user')
      .exec();

    if(exam.user._id == user.id)
      return exam
    else
      return {status: 'forbidden', isAuthenticated: false}
  }

  public static async getExamBySlug(slug : string, user: any) {
    const exam = await this.findOne({slug: slug, 'user': user._id}).populate('user');
    return exam
  }

  public static async deleteExam(id:string , user: any) {
    const exam = await this.findById(id).exec();
    if(exam.userId == user.id)
      return await this.deleteOne({id: id})
    else
      return {status: 'forbidden', isAuthenticated: false}
  }

  public static async createExam(data, user, slug, ip) {

    console.log(data);
    console.log(user);
    console.log(slug);
    console.log(ip);

    data['user'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()
    data['isOpen'] = false

    /* data.startDate.replace(' ', 'T')
    data.startDate = `${data.startDate} ${data.startTime}`
    data.endDate.replace(' ', 'T')
    data.endDate = new Date(data.endDate) */


    try {
      data.startDate = await DateTimeService.createDateObject(data.startDate, data.startTime, ip)
      data.endDate = await DateTimeService.createDateObject(data.endDate, data.endTime, ip)
    } catch (error) {
      console.error('Error:', error.message);
    }
    console.log(data);

    const exam = new Exam(data);
    exam.save((err, savedExam) => {
      if (err) {
        console.log(err);
        throw err;
      }
      // schedule the job to close the exam
      Scheduler.getInstance().scheduleExamSimple(savedExam.startDate, savedExam.endDate, {
        examId: savedExam._id,
      });
    });

    return exam // exam[0]
  }
}

examSchema.loadClass(ExamClass);

const Exam = mongoose.model<ExamDocument, ExamModel>('Exam', examSchema);

export default Exam;