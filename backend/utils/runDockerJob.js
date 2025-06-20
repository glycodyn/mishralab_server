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
  const logPath = path.join(outputSubdir, 'alphafold.log');
  const logStream = fs.createWriteStream(logPath);
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

      proc.stdout.pipe(logStream);
      proc.stderr.pipe(logStream);
  
      proc.on('close', async (code) => {
        logStream.end();

  
  const logContent = fs.readFileSync(logPath, 'utf8');
  
  const errorPatterns = [
    { pattern: /RESOURCE_EXHAUSTED|Out of memory/i, status: 'failed_oom' },
    { pattern: /No sequence data found/i, status: 'failed_no_sequence' },
    { pattern: /Invalid input format/i, status: 'failed_invalid_input' },
    { pattern: /Connection timed out/i, status: 'failed_timeout' }
  ];
  
  for (const { pattern, status } of errorPatterns) {
    if (pattern.test(logContent)) {
      await redisClient.hSet(`job:${jobId}`, 'status', status);
      await Job.updateOne({ jobId }, { $set: { status, failedAt: new Date() } });
      return resolve();
    }
  }
  
  if (code !== 0) {
    const errorLines = logContent.split('\n').filter(line => 
      /Error:|Exception:|failed:|CRITICAL|WARNING:|Fatal:/i.test(line)
    );
    
    let errorMsg = errorLines.length > 0 
      ? errorLines[errorLines.length - 1].trim() 
      : "Unexpected error occurred";
    
    if (errorMsg.length > 200) {
      errorMsg = errorMsg.substring(0, 197) + '...';
    }
    
    const status = `failed: ${errorMsg}`;
    
    await redisClient.hSet(`job:${jobId}`, { status });
    await Job.updateOne({ jobId }, { 
      $set: { 
        status,
        failedAt: new Date()
      } 
    });
    
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
          try{
          await sendNotification(email, jobId, jobTitle);
          }
          catch(err){
            console.error('Error sending notification:', err);
          }
          resolve();
        });
      });
    });
  }

  module.exports = runDockerJob;