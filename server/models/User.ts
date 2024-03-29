import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify';

const UserSchema = new mongoose.Schema({
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
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  coderId:  {
    type: String,
    unique: true,
    sparse: true,
  },
  googleToken: {
    accessToken: String,
    refreshToken: String,
  },
  isSignedupViaGoogle: {
    type: Boolean,
    required: true,
    default: false,
  },
  displayName: String,
  avatarUrl: String,
  darkTheme: Boolean,
  gitea: Object,
  sessionPass: String,
  organizationId: String,
  coderSessionToken: String,
});

export interface UserDocument extends mongoose.Document {
  slug: string;
  createdAt: Date;
  email: string;
  displayName: string;
  avatarUrl: string;
  darkTheme: boolean;
  googleId: string;
  googleToken: { accessToken: string; refreshToken: string };
  isSignedupViaGoogle: boolean;
  gitea: object,
  sessionPass: string,
  organizationId: string,
  coderId: string,
  coderSessionToken: string,
}

interface UserModel extends mongoose.Model<UserDocument> {
  getUserBySlug({ slug }: { slug: string }): Promise<UserDocument>;

  updateProfile({
    userId,
    name,
    avatarUrl,
  }: {
    userId: string;
    name: string;
    avatarUrl: string;
  }): Promise<UserDocument[]>;

  updatePass({userId,newPass}:
  {
    userId: string;
    newPass: string;
  }): Promise<UserDocument>;

  updateCoderData({userId,organizationId,coderId,coderSessionToken}:
  {
    userId: string;
    organizationId: string;
    coderId: string;
    coderSessionToken: string;
  }): Promise<UserDocument>;

  publicFields(): string[];

  signInOrSignUpViaGoogle({
    googleId,
    email,
    displayName,
    avatarUrl,
    googleToken,
    gitea
  }: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    googleToken: { accessToken?: string; refreshToken?: string };
    gitea: object;
  }): Promise<UserDocument>;

  toggleTheme({
    userId,
    darkTheme,
  }: {
    userId: string;
    darkTheme: boolean;
  }): Promise<boolean>;
}

class UserClass extends mongoose.Model {
  public static async getUserBySlug({ slug }) {
    console.log('Static method: getUserBySlug');

    return this.findOne({ slug }, 'email displayName avatarUrl').setOptions({ lean: true });
  }

  public static async updateProfile({ userId, name, avatarUrl }) {
    console.log('Static method: updateProfile');

    const user = await this.findById(userId, 'slug displayName');

    const modifier = { displayName: user.displayName, avatarUrl, slug: user.slug };

    if (name !== user.displayName) {
      modifier.displayName = name;
      modifier.slug = await generateSlug(this, name);
    }

    return this.findByIdAndUpdate(userId, { $set: modifier }, { new: true, runValidators: true })
      .select('displayName avatarUrl slug')
      .setOptions({ lean: true });
  }

  public static async updatePass({ userId, newPass}){
    console.log('Static method: updatePass');
    const user = await this.findById(userId);
    user.sessionPass = newPass;
    user.save();

    return user;
  }

  public static async updateCoderData({userId,organizationId,coderId,coderSessionToken}){
    console.log('Static method: updateCoder');
    const user = await this.findById(userId);
    user.organizationId = organizationId;
    user.coderSessionToken =coderSessionToken;
    user.coderId = coderId
    user.save();

    return user;
  }

  public static publicFields(): string[] {
    return ['_id', 'id', 'displayName', 'email', 'avatarUrl', 'slug', 'isSignedupViaGoogle', 'gitea', 'sessionPass', 'coderId', 'organizationId', 'coderSessionToken'];
  }

  public static async signInOrSignUpViaGoogle({
    googleId,
    email,
    displayName,
    avatarUrl,
    googleToken,
    gitea,
  }) {
    const user = await this.findOne({ email })
      .select([...this.publicFields(), 'googleId'].join(' '))
      .setOptions({ lean: true });

    if (user) {
      if (_.isEmpty(googleToken) && user.googleId) {
        return user;
      }

      const modifier = { googleId };
      if (googleToken.accessToken) {
        modifier['googleToken.accessToken'] = googleToken.accessToken;
      }

      if (googleToken.refreshToken) {
        modifier['googleToken.refreshToken'] = googleToken.refreshToken;
      }

      await this.updateOne({ email }, { $set: modifier });

      return user;
    }

    const slug = await generateSlug(this, displayName);

    const newUser = await this.create({
      createdAt: new Date(),
      googleId,
      email,
      googleToken,
      displayName,
      avatarUrl,
      slug,
      isSignedupViaGoogle: true,
      darkTheme: false,
      gitea,
    });

    return _.pick(newUser, this.publicFields());
  }

  public static async toggleTheme({ userId, darkTheme }) {
    await this.updateOne({_id: userId}, { $set: {darkTheme}})
    return true
  }
}

UserSchema.loadClass(UserClass);

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);

export default User;