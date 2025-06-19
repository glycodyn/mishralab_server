const express = require('express');
const mongoose = require('mongoose');
const Job = require('./config/mongoConfig.js'); 
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const jobQueue = require('./utils/queue.js'); 
const convertToAlphafoldJson = require('./utils/convertToJson.js');
const runDockerJob = require('./utils/runDockerJob.js'); 
const redisClient = require('./utils/redisClient.js')
const  sendNotification = require('./utils/emailer.js')
const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

mongoose.connect('mongodb://localhost:27017/alphafold', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


const logsMap = new Map();


const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/af_uploads';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/af_outputs';




// Ensure directories exist
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });

// File upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });



app.post('/predict', upload.single('file'), async (req, res) => {
  const email = req.body.email;
  const jobTitle = req.body.jobTitle
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const inputFile = req.file;
  if (!inputFile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }


  
  const jobId = uuidv4();
   const ext = path.extname(inputFile.originalname) || '.fasta';
  const fastaFilename = `${jobId}${ext}`;
  const fastaPath = path.join(UPLOAD_FOLDER, fastaFilename);

  fs.renameSync(inputFile.path, fastaPath); // Move file to final location


  let jsonFilename = `${jobId}.json`;
  const jsonPath = path.join(UPLOAD_FOLDER, jsonFilename);
 
  if (inputFile.mimetype !== 'application/json') {
    const inputData = fs.readFileSync(fastaPath, 'utf8');
    const convertedData = convertToAlphafoldJson(inputData, fastaFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(convertedData, null, 2));
  } else{
    fs.renameSync(fastaPath, jsonPath); 
  }

  

const job = new Job({
  jobId,
  email,
  jobTitle,
  filename: jsonFilename,
  status: 'queued',
  createdAt: new Date()
});
await job.save();

   
  logsMap.set(jobId, []);

  await redisClient.hSet(`job:${jobId}`, {
    email,
    filename: jsonFilename,
    status: 'queued',
    createdAt: new Date().toISOString()
  });
  await redisClient.sAdd(`email:${email}`,jobTitle,jobId);

  res.json({ jobId });

  jobQueue.add(() => runDockerJob(jobId, jsonFilename, email, jobTitle), jobId);
});




app.get('/jobs/:email', async (req, res) => {
  const email = req.params.email;
  const jobs = await Job.find({ email }).sort({ createdAt: -1 }).lean();
  res.json(jobs);
});

//app.get('/logs/:jobId', (req, res) => {
//  const { jobId } = req.params;
//  if (!logsMap.has(jobId)) return res.status(404).send('Job not found');
//
//  res.setHeader('Content-Type', 'text/event-stream');
//  res.setHeader('Cache-Control', 'no-cache');
//  res.setHeader('Connection', 'keep-alive');
//  res.setHeader('Access-Control-Allow-Origin', '*');
//
//  res.write(`:\n\n`);// Set retry interval for EventSource
//
//  res.write('retry: 10000\n\n');
//
//  let lastIndex = 0;
//
//  const interval = setInterval(() => {
//  const logs = logsMap.get(jobId);
//  if (!logs) return;
//
//  let sentLogs = false;
//  while (lastIndex < logs.length) {
//    const logLine = logs[lastIndex++];
//    try {
//      res.write(`data: ${logLine}\n\n`);
//      sentLogs = true;
//    } catch (err) {
//      clearInterval(interval);
//      return;
//    }
//  }
//  // Send heartbeat comment if no logs sent
//  if (!sentLogs) {
//    try {
//      res.write(':\n\n');
//    } catch (err) {
//      clearInterval(interval);
//    }
//  }
//}, 1000);
//
//  req.on('close', () => {
//    clearInterval(interval);
//  });
//});

// GET /download/:filename
app.get('/download/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const zipFilename = `${jobId}.zip`;
  const zipPath = path.join(OUTPUT_FOLDER, zipFilename);

  // Check if file exists
  fs.access(zipPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`Zip file for job ${jobId} not found`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Send file for download
    res.download(zipPath, zipFilename, (err) => {
      if (err) {
        console.error(`Download error for job ${jobId}:`, err);
        return res.status(500).json({ error: 'File download failed' });
      }
    });
  });
});

app.get('/position/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  // Check if the job is currently running
  if (
    jobQueue.isRunning &&
    jobQueue.currentJobId === jobId
  ) {
    return res.json({ position: 0, running: true });
  }
  // Check if the job is in the queue
  const position = jobQueue.queue.findIndex(fn => fn.jobId === jobId);
  if (position === -1) return res.json({ position: 0, running: false });
  res.json({ position: position + 1, running: false }); // 1-based index
});

app.get(['/cif/jobId', '/cif/:jobId.cif'], (req, res) => {
  const jobId = req.params.jobId.replace(/\.cif$/, '');
  const cifPath = path.join(OUTPUT_FOLDER, jobId, jobId, `${jobId}_model.cif`);

  fs.access(cifPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`CIF file for job ${jobId} not found`);
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(cifPath);
  });
}
)

app.get(['/confidence/jobID', '/confidence/:jobId.json'], (req, res) => {
  const jobId = req.params.jobId.replace(/\.json$/, '');
  const jsonPath = path.join(OUTPUT_FOLDER, jobId, jobId, `${jobId}_confidences.json`);
  console.log('Looking for confidence JSON at:', jsonPath); // <-- Add this line

  fs.access(jsonPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`Confidence JSON for job ${jobId} not found`);
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(jsonPath);
  });
});


// Start the server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  try {
    
    await Job.updateMany({ status: 'running' }, { $set: { status: 'queued' } });

   
    const queuedJobs = await Job.find({ status: 'queued' }).sort({ createdAt: 1 }).lean();
    console.log(`Found ${queuedJobs.length} queued jobs at startup`);
    for (const job of queuedJobs) {
      console.log(`Queueing job at startup: ${job.jobId}`);
      jobQueue.add(() => runDockerJob(job.jobId, job.filename, job.email, job.jobTitle), job.jobId);
    }
  } catch (err) {
    console.error('Error starting queued jobs at startup:', err);
  }
});
