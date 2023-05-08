import * as mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
  },
  link: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  isOpen: Boolean,
});

interface EventDocument extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId,
  fromUser: mongoose.Schema.Types.ObjectId,
  name: string,
  description: string,
  link: string,
  type: Date,
  createdAt: boolean,
}

interface EventModel extends mongoose.Model<EventDocument> {
  getEvent(eventId: string, user: any): Promise<EventDocument>;

  getEvents(user: any): Promise<EventDocument[]>;

  createEvent(eventData: any): Promise<EventDocument>;

  updateEvent(eventData: any): Promise<EventDocument>;
}

class EventClass extends mongoose.Model {
  public static async getEvent(eventId: string, user: any) {
    try {
      const event = await this.findOne({id: eventId, user: user._id})
        .populate('user')
        .populate('fromUser')
      return event
    } catch (error) {
      console.error(`failed to get event: ${error}`);
    }
  }

  public static async getEvents(user: any) {
    try {
      const events = await this.find({ user: user._id, isOpen: true })
        .sort({ createdAt: 'desc' })
        .populate('user')
        .populate('fromUser')
      return events
    } catch (error) {
      console.error(`failed to get events: ${error}`);
    }
  }
/*
{
  name, description, fromUserId,
}
*/
  public static async createEvent(eventData: any) {
    try {
      const data = {
        user: eventData.userId,
        fromUser: eventData.fromUser,
        name: eventData.name,
        type: eventData.type,
        link: eventData.link,
        description: eventData.description,
        createdAt: new Date(),
        isOpen: true,
      }
      return await this.create(data)
    } catch (error) {
      console.error(`failed to create event: ${error}`);
    }
  }

  public static async updateEvent(id: any) {
    try {
      const modifier = { isOpen: false };
      return this.findByIdAndUpdate(id, { $set: modifier }, { new: true, runValidators: true })
        .setOptions({ lean: true });
    } catch (error) {
      console.error(`failed to update event: ${error}`);
    }
  }
}

eventSchema.loadClass(EventClass);

const Event = mongoose.model<EventDocument, EventModel>('Event', eventSchema);

export default Event;