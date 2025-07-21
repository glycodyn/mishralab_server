const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const runLigandMPNNDocker = require('../utils/runLigandMPNNDocker.js');
const {  LigandMPNNJob } = require('../config/mongoConfig.js');
const LigandMPNNJobQueue = require('../utils/ligandMPNN_Queue.js')
const archiver = require('archiver');


const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/LigandMPNN_Inputs';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/LigandMPNN_outputs';





const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });

router.post('/run', upload.single('file'), async (req, res) => {
    console.log('req.body:', req.body);
    console.log('req.headers:', req.headers);
    console.log('token:', req.cookies.token);
    const pdbFile = req.file;
    if (!pdbFile) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const jobId = uuidv4();
       const ext = path.extname(pdbFile.originalname) || '.fasta';
      const pdbFilename = `${jobId}${ext}`;
      const pdbPath = path.join(UPLOAD_FOLDER, pdbFilename);

        try {
    fs.renameSync(pdbFile.path, pdbPath);
  } catch (err) {
    return res.status(500).json({ error: 'File processing error' });
  }

  const outputDir = path.join(OUTPUT_FOLDER, jobId);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const params = {
    model_type: req.body.model_type,
    seed: req.body.seed,
    checkpoint_ligand_mpnn: req.body.checkpoint_ligand_mpnn,
    checkpoint_protein_mpnn: req.body.checkpoint_protein_mpnn,
    checkpoint_soluble_mpnn: req.body.checkpoint_soluble_mpnn,
    temperature: req.body.temperature,
    verbose: req.body.verbose,
    save_stats: req.body.save_stats,
    pack_side_chains: req.body.pack_side_chains,
    number_of_batches: req.body.number_of_batches,
    batch_size: req.body.batch_size,
  }


  const ligandMpnnJob = new LigandMPNNJob({
    jobId,
    email: req.body.email,
    userId: req.body.userId,
    jobTitle: req.body.jobTitle || 'Ligand MPNN Job',
    pdbFilename,
    status: 'queued',
    createdAt: new Date()
  });
  await ligandMpnnJob.save();

  
LigandMPNNJobQueue.add(runLigandMPNNDocker({jobId,pdbPath, outputDir, params}),jobId)
  
  

  res.json({ jobId, message: 'Job submitted and will run when enough VRAM is available.' });
        
    
})

router.get('/jobs/:email', async (req, res) => {
  const email = req.params.email;
  const jobs = await LigandMPNNJob.find({ email }).sort({ createdAt: -1 }).lean();
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




module.exports = router;