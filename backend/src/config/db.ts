import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectToDb = async() => {
    try{

        await mongoose.connect(process.env.DATABASE_URL!);

        console.log('database connected successfully');

    }catch(err){
        console.log('error occured while connectin to database', err);
        process.exit(1);
    }
}