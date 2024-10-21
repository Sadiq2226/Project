const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    correctAnswer: { type: String, required: true }
});

const examSchema = new mongoose.Schema({
    examName: { type: String, required: true },
    examDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    questions: { type: [questionSchema], required: true }, // This should be an array of question objects
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' } // Reference to User model
});

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
