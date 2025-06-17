const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  jobTitle: String,
  filename: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);