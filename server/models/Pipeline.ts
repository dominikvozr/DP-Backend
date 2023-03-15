// import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify';

const pipelineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
  },
  language: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  file: {
    type: Object,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

interface PipelineDocument extends mongoose.Document {
  name: string,
  userId: string,
  description: string,
  file: object,
  slug: string,
  createdAt: Date,
  language: string,
  type: string,
}

interface PipelineModel extends mongoose.Model<PipelineDocument> {
  //getUserBySlug({ slug }: { slug: string }): Promise<PipelineDocument>;

  getPipelinesByUser({ userId }: { userId: string }): Promise<PipelineDocument[]>;

  getPipelines(): Promise<PipelineDocument[]>;

  updatePipeline({
    name,
    description,
    file,
    slug,
    createdAt,
    language,
    type,
  }: {
    name: string,
    description: string,
    file: object,
    slug: string,
    createdAt: Date,
    language: string,
    type: string,
  }): Promise<PipelineDocument[]>;

  createPipeline({
    name,
    userId,
    description,
    file,
    slug,
    createdAt,
    language,
    type,
  }: {
    name: string,
    userId: string,
    description: string,
    file: object,
    slug: string,
    createdAt: Date,
    language: string,
    type: string,
  }, user: Express.User): Promise<PipelineDocument[]>;
}

class PipelineClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'name userId description file slug createdAt language type').setOptions({ lean: true });
  }

  public static async createPipeline(data, user) {
    console.log('Static method: createPipeline');
    console.log(data, user);

    const slug = await generateSlug(this, data.name);

    data['userId'] = user._id
    data['slug'] = slug
    data['createdAt'] = new Date()

    const pipeline = await this.insertMany([data])
    return pipeline[0]
  }

  public static async getPipelines() {
    const pipelines = await this.find()
    return pipelines
  }

  public static async updatePipeline({ pipelineId, name, avatarUrl }) {
    console.log('Static method: updatePipeline');

    const user = await this.findById(pipelineId, 'name description file slug createdAt language type');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    if (name !== user.displayName) {
      modifier.displayName = name;
     // modifier.slug = await generateSlug(this, name);
    }

    return this.findByIdAndUpdate(pipelineId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  }
}

pipelineSchema.loadClass(PipelineClass);

const Pipeline = mongoose.model<PipelineDocument, PipelineModel>('Pipeline', pipelineSchema);

export default Pipeline;