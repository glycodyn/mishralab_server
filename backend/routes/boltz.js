const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const runBoltzDockerJob = require('../utils/runBoltzDockerJob.js')
const {  BoltzJob } = require('../config/mongoConfig.js');
const JobQueue = require('../utils/queue.js')
const archiver = require('archiver');


const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/boltz_inputs';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/boltz_outputs';





const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });

router.post('/run', upload.single('file'), async (req, res) => {
  const inputFile = req.file;
  if (!inputFile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = uuidv4();
  // Accept .yaml, .yml, .fa, .fasta (default to .yaml if unknown)
  let ext = path.extname(inputFile.originalname).toLowerCase();
  if (!['.yaml', '.yml', '.fa', '.fasta'].includes(ext)) ext = '.yaml';
  const inputFilename = `${jobId}${ext}`;
  console.log('Input file will be saved as:', inputFilename);
  const inputPath = path.join(UPLOAD_FOLDER, inputFilename);

  try {
    fs.renameSync(inputFile.path, inputPath);
  } catch (err) {
    return res.status(500).json({ error: 'File processing error' });
  }

  // Save job to DB
  const boltzJob = new BoltzJob({
    jobId,
    email: req.body.email,
    userId: req.body.userId,
    jobTitle: req.body.jobTitle || 'Boltz Job',
    inputFilename,
    status: 'queued',
    createdAt: new Date()
  });
  await boltzJob.save();

  // Add to job queue (make sure your runner expects these args)
  JobQueue.add(() => runBoltzDockerJob(jobId, inputFilename, req.body.email, req.body.jobTitle), jobId);

  res.json({ jobId, message: 'Job submitted and will run when resources are available.' });
});

router.get('/jobs/:email', async (req, res) => {
  const email = req.params.email;
  const jobs = await BoltzJob.find({ email }).sort({ createdAt: -1 }).lean();
  res.json(jobs);
});

router.get('/sequence/:jobId', async (req, res) => {
    try{
        const jobId = req.params.jobId;
        filePath = path.join(OUTPUT_FOLDER,jobId,"seqs",`${jobId}.fa`)
        console.log('Looking for fasta file at:', filePath); 
        
          fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error(`fasta file for job ${jobId} not found`);
              return res.status(404).json({ error: 'File not found' });
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(filePath, (err) => {
               if (err) {
                  console.error(`Error sending fasta file for job ${jobId}:`, err);
                  return res.status(500).json({ error: 'File delivery failed' });
                }
            })
          });
        }catch (err) {
          console.error('Error in /sequence endpoint:', err);
          res.status(500).json({ error: 'Server error processing your request' });
        }
    

})

router.get('/download/:jobId', async (req, res) => {
    try{
        const jobId = req.params.jobId;
        const jobDir = path.join(OUTPUT_FOLDER, jobId);
        if (!fs.existsSync(jobDir)) {
      console.error(`Directory for job ${jobId} not found`);
      return res.status(404).json({ error: 'Job output directory not found' });
    }

    // Set headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${jobId}.zip`);

    // Create a zip archive and pipe it to the response
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(jobDir, false);
    archive.on('error', err => {
      console.error(`Error creating zip for job ${jobId}:`, err);
      res.status(500).send({ error: 'Error creating zip file' });
    });
    archive.pipe(res);
    archive.finalize();
  } catch (err) {
    console.error('Error in /download endpoint:', err);
    res.status(500).json({ error: 'Server error processing your request' });
  }
    

})

//serve the cif file for mol*  viewer
router.get('/cif/:jobId', async (req, res) => {
    try{
        const jobId = req.params.jobId;
        const cifPath = path.join(OUTPUT_FOLDER, jobId,`boltz_results_${jobId}`, 'predictions',jobId ,`${jobId}_model_0.cif`);
        console.log('Looking for cif file at:', cifPath); 
        
          fs.access(cifPath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error(`CIF file for job ${jobId} not found`);
              return res.status(404).json({ error: 'File not found' });
            }
            res.setHeader('Content-Type', 'chemical/x-cif');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(cifPath, (err) => {
               if (err) {
                  console.error(`Error sending CIF file for job ${jobId}:`, err);
                  return res.status(500).json({ error: 'File delivery failed' });
                }
            })
          });
        }catch (err) {
          console.error('Error in /cif endpoint:', err);
          res.status(500).json({ error: 'Server error processing your request' });
        }
    })




module.exports = router;