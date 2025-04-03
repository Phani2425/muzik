import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    }
  },
  tracks:{
    type:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Track"
      }
    ],
    default:[]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Room', RoomSchema);