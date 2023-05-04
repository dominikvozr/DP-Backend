// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import Test from './Test';
import Event from './Event';

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  message: {
    type: String,
  },
  response: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  isOpen: Boolean,
});

interface ReportDocument extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId,
  test: mongoose.Schema.Types.ObjectId,
  message: string,
  createdAt: Date,
  isOpen: boolean,
}

interface ReportModel extends mongoose.Model<ReportDocument> {
  getReport(reportId: string, user: any): Promise<ReportDocument[]>;

  getTestReports(testId: string, user: any): Promise<ReportDocument[]>;

  createReport(reportData: any, user: any): Promise<ReportDocument[]>;

  updateReport(reportData: any, test: any, user: any): Promise<ReportDocument[]>;
}

class ReportClass extends mongoose.Model {
  public static async getReport(reportId: string, user: any) {
    try {
      const report = await this.findOne({id: reportId, user: user._id})
        .populate('user')
        .populate('test')
      return report
    } catch (error) {
      console.log(`failed to get reports: ${error}`);
    }
  }

  public static async getTestReports (testId: string, user: any) {
    try {
      const test = await Test.findOne({id: testId, user: user._id})
      const reports = await this.find({test: test._id})
        .populate('user')
        .populate('test')
      return reports
    } catch (error) {
      console.log(`failed to get reports: ${error}`);
    }
  }

  public static async createReport(reportData: any, user: any) {
    try {
      const data = {
        user: user._id,
        test: reportData.testId,
        message: reportData.message,
        createdAt: new Date(),
        isOpen: true,
      }
      const report = new Report(data)
      report.save(function (err) {
        if (err) console.log(err);
      });
      const test: any = await Test.getTestById(reportData.testId, user)//  .findById(reportData.testId)
      test.reports.push(report._id)
      test.save(function (err) {
        if (err) console.log(err);
      });
      Event.createEvent({
        userId: test.exam.user._id,
        fromUser: test.user._id,
        name: `Report: ${test.exam.name}`,
        description: `${test.user.displayName}: ${report.message}`,
        link: `professor/exam/${test.exam.id}?email=${test.user.email}&tab=reports`,
        type: 'report',
      });
      return report
    } catch (error) {
      console.log(`failed to get reports: ${error}`);
    }
  }

  /*
  {
    testSlug,
    response,
    reportId,
    isOpen
  }
  */

  public static async updateReport(reportData: any, test: any, user: any) {
    try {
      const modifier = { isOpen: false, response: reportData.response };
      const report = await this.findByIdAndUpdate(reportData.id, { $set: modifier }, { new: true, runValidators: true })
        .setOptions({ lean: true });
      Event.createEvent({
        userId: test.user._id,
        fromUser: user._id,
        name: `Response on ${test.exam.name}`,
        description: `${user.displayName}: ${reportData.response}`,
        link: `student/test/${test.slug}/#reports`,
        type: 'report',
      });
      return report
    } catch (error) {
      console.log(`failed to update report: ${error}`);
    }
  }
}

reportSchema.loadClass(ReportClass);

const Report = mongoose.model<ReportDocument, ReportModel>('Report', reportSchema);

export default Report;