import mongoose from 'mongoose'

const TrackSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    smallThumbnail:{
        type:String
    },
    bigThumbnail:{
        type:String
    }
})

export default mongoose.model('Track',TrackSchema);