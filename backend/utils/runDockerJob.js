const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const redisClient = require('./redisClient');
const sendNotification = require('./emailer');
const moongoose = require('mongoose');
const Job = require('../config/mongoConfig');

const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/af_uploads';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/af_outputs';


async function runDockerJob(jobId, filename, email, jobTitle) {

  
  if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
   
  const outputSubdir = path.join(OUTPUT_FOLDER, jobId);
  if (!fs.existsSync(outputSubdir)) fs.mkdirSync(outputSubdir, { recursive: true })
  
  await redisClient.hSet(`job:${jobId}`, 'status', 'running');
  await Job.updateOne({ jobId },{$set:  { status: 'running' }});
  
     const dockerCommandArgs = [
      'run', '--rm', '--gpus', 'all',
      '-e', 'XLA_CLIENT_MEM_FRACTION=0.95',
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
  
    return new Promise((resolve) => {
      const proc = spawn('docker', dockerCommandArgs);
  
      proc.on('close', async (code) => {
        if (code !== 0) {
          await redisClient.hSet(`job:${jobId}`, 'status', 'failed');
          await Job.deleteOne({ jobId });
          return resolve();
        }
  
  
  
      // Create zip archive
      const zipFilename = `${jobId}.zip`;
      const zipPath = path.join(OUTPUT_FOLDER, zipFilename);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
  
      archive.pipe(output);
        archive.directory(outputSubdir, false);
        archive.finalize();
  
        output.on('close', async () => {
          await redisClient.hSet(`job:${jobId}`, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            zipPath
          });
          await Job.updateOne({ jobId }, { $set: { status: 'completed', completedAt: new Date() } });
          await sendNotification(email, jobId, jobTitle);
          resolve();
        });
      });
    });
  }

  module.exports = runDockerJob;