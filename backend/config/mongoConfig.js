const mongoose = require('mongoose');

const AlphaFold3JobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: String,
  filename: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const LigandMPNNJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: String,
  pdbFilename: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  
});


module.exports = {
  AlphaFold3Job: mongoose.model('AlphaFold3Job', AlphaFold3JobSchema),
  LigandMPNNJob: mongoose.model('LigandMPNNJob', LigandMPNNJobSchema),
  User: mongoose.model('User', UserSchema)
};