const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

const logsMap = new Map();


const UPLOAD_FOLDER = '/home/mishra_lab/input';
const OUTPUT_FOLDER = '/home/mishra_lab/af_output';




// Ensure directories exist
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });

// File upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });

// POST /predict route
app.post('/predict', upload.single('file'), (req, res) => {
  const inputFile = req.file;
  if (!inputFile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = uuidv4();
   res.json({ jobId });
  logsMap.set(jobId, []);

  const filename = inputFile.filename;
const outputSubdir = path.join(OUTPUT_FOLDER, jobId);
if (!fs.existsSync(outputSubdir)) fs.mkdirSync(outputSubdir, { recursive: true })

   const dockerCommandArgs = [
    'run', '--rm', '--gpus', 'all',
    '-e', 'XLA_CLIENT_MEM_FRACTION=0.5',
    '-v', `${UPLOAD_FOLDER}:/home/mishra_lab/input`,
    '-v', `${outputSubdir}:/home/mishra_lab/af_output`,
    '-v', '/home/mishra_lab/Parameters:/home/mishra_lab/Parameters',
    '-v', '/home/mishra_lab/public_databases:/home/mishra_lab/public_databases',
    'alphafold3',
    'python', 'run_alphafold.py',
    `--json_path=/home/mishra_lab/input/${filename}`,
    '--model_dir=/home/mishra_lab/Parameters',
    '--db_dir=/home/mishra_lab/public_databases',
    '--output_dir=/home/mishra_lab/af_output'
  ];

const dockerProcess = spawn('docker', dockerCommandArgs);

dockerProcess.stdout.on('data', (data) => {
  const line = data.toString();
  logsMap.get(jobId).push(line);
});

dockerProcess.stderr.on('data', (data) => {
  const line = data.toString();
  logsMap.get(jobId).push(`[stderr] ${line}`);
  
});

dockerProcess.on('close', (code) => {
  logsMap.get(jobId).push(`Docker process exited with code ${code}`);

  if (code !== 0) {
    logsMap.get(jobId).push(`[error] Prediction failed. Docker exited with code ${code}`);
      return;
  }


    // Create zip archive
    const zipFilename = `${jobId}.zip`;
    const zipPath = path.join(OUTPUT_FOLDER, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', err => {
      logsMap.get(jobId).push(`[error] Zip failed: ${err.message}`);
    });

    output.on('close', () => {
      logsMap.get(jobId).push(`Prediction complete. Download link: /download/${zipFilename}`);
    });



   
    archive.pipe(output);
    archive.directory(outputSubdir, false);
    archive.finalize();
  });
});

app.get('/logs/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!logsMap.has(jobId)) return res.status(404).send('Job not found');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write(`:\n\n`);// Set retry interval for EventSource

  res.write('retry: 10000\n\n');

  let lastIndex = 0;

  const interval = setInterval(() => {
  const logs = logsMap.get(jobId);
  if (!logs) return;

  let sentLogs = false;
  while (lastIndex < logs.length) {
    const logLine = logs[lastIndex++];
    try {
      res.write(`data: ${logLine}\n\n`);
      sentLogs = true;
    } catch (err) {
      clearInterval(interval);
      return;
    }
  }
  // Send heartbeat comment if no logs sent
  if (!sentLogs) {
    try {
      res.write(':\n\n');
    } catch (err) {
      clearInterval(interval);
    }
  }
}, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

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
// Start the server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
