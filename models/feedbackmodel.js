import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    subscriptioData: {
        type: Object,
        required: true
    },
    feedback: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    image: String
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;