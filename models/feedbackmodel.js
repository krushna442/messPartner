import mongoose from 'mongoose';
const feedbackSchema = new mongoose.Schema ({
    user_id:String,
    name:String,
    Vendor_id:String,
    feedback:String,
    rating:Number,
    image: String
},{timestamps:true});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;