const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const VRAMJobQueue = require('./getAvailableVRAM.js')
const {LigandMPNNJob} = require('../config/mongoConfig.js')

const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/LigandMPNN_Inputs';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/LigandMPNN_outputs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });
function runLigandMPNNDocker({ jobId, pdbPath, outputDir, params }) {
    if (!jobId || !pdbPath || !outputDir) {
    throw new Error('Missing required argument to runLigandMPNNDocker');
    }
    return()=> new Promise((resolve, reject) => {
        if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
    const outputSubdir = path.join(OUTPUT_FOLDER, jobId);
    if (!fs.existsSync(outputSubdir)) fs.mkdirSync(outputSubdir, { recursive: true });
    const logPath = path.join(outputSubdir, 'ligandmpnn.log');
    const logStream = fs.createWriteStream(logPath);

    LigandMPNNJob.updateOne(
      { jobId },
      { $set: { status: 'running', jobType: 'ligandmpnn' } }
    ).catch((err) => {
      console.error(`Error updating job status for ${jobId}:`, err);
    });

        const{spawn} = require('child_process');
        const dockerCommandArgs = [
            'run', '--rm', '--gpus', 'all',
            '-e', 'XLA_PYTHON_CLIENT_PREALLOCATE=false',
            '-v', `${path.dirname(pdbPath)}:/app/LigandMPNN/inputs`,
            '-v', `${outputDir}:/app/LigandMPNN/outputs`,
            'ligand_mpnn',
            'python3', 'run.py',
            ...(params.seed ? ['--seed', params.seed] : []),
            ...(params.checkpoint_ligand_mpnn ? ['--checkpoint_ligand_mpnn', params.checkpoint_ligand_mpnn] : []),
            ...(params.checkpoint_protein_mpnn ? ['--checkpoint_protein_mpnn', params.checkpoint_protein_mpnn] : []),
            ...(params.checkpoint_soluble_mpnn ? ['--checkpoint_soluble_mpnn', params.checkpoint_soluble_mpnn] : []),
            ...(params.temperature ? ['--temperature', params.temperature] : []),
            ...(params.verbose ? ['--verbose', params.verbose] : []),
            ...(params.save_stats ? ['--save_stats', params.save_stats] : []),
            ...(params.pack_side_chains ? ['--pack_side_chains', params.pack_side_chains] : []),
            ...(params.number_of_batches ? ['--number_of_batches', params.number_of_batches] : []),
            ...(params.batch_size ? ['--batch_size', params.batch_size] : []),
            '--pdb_path', `inputs/${path.basename(pdbPath)}`,
            '--out_folder', 'outputs'

        ];
         
    const proc = spawn('docker', dockerCommandArgs);

    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);

    proc.on('close', async (code) => {
      logStream.end();
      const logContent = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';

      if (code !== 0) {
        const errorLines = logContent.split('\n').filter(line =>
          /Error:|Exception:|failed:|CRITICAL|WARNING:|Fatal:/i.test(line)
        );
        let errorMsg = errorLines.length > 0
          ? errorLines[errorLines.length - 1].trim()
          : "Unexpected error occurred";
        const status = `failed: ${errorMsg}`;
        await LigandMPNNJob.updateOne(
          { jobId },
          { $set: { status, failedAt: new Date() } }
        ).catch((err) => console.error(`Error updating error status for job ${jobId}:`, err));
        return resolve();
      } else if(code ===0){
        await LigandMPNNJob.updateOne(
            { jobId },
            { $set: { status: 'completed', completedAt: new Date() } }
        ).catch((err) => console.error(`Error updating job status for ${jobId}:`, err));
        return resolve();
      }
    })
})
}

module.exports = runLigandMPNNDocker;