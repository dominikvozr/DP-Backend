// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
//import { generateSlug } from '../utils/slugify';

const examSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: String,
  avatarUrl: String,
});

interface ExamDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface ExamModel extends mongoose.Model<ExamDocument> {
  getUserBySlug({ slug }: { slug: string }): Promise<ExamDocument>;

  updateProfile({
    userId,
    name,
    avatarUrl,
  }: {
    userId: string;
    name: string;
    avatarUrl: string;
  }): Promise<ExamDocument[]>;
}

class ExamClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
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

const Exam = mongoose.model<ExamDocument, ExamModel>('User', examSchema);

export default Exam;