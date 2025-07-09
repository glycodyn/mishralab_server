const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const redisClient = require('./redisClient');
const sendNotification = require('./emailer');
const moongoose = require('mongoose');

const {BoltzJob} = require('../config/mongoConfig');

const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/boltz_Inputs';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/boltz_outputs';



async function runBoltzDockerJob(jobId, filename, email, jobTitle) {
    return new Promise(async(resolve, reject)=>{
try{
  
  if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
   
  const outputSubdir = path.join(OUTPUT_FOLDER, jobId);
  if (!fs.existsSync(outputSubdir)) fs.mkdirSync(outputSubdir, { recursive: true })
  const logPath = path.join(outputSubdir, 'boltz.log');
  const logStream = fs.createWriteStream(logPath);
  try{
  await redisClient.hSet(`job:${jobId}`, 'status', 'running');
  await BoltzJob.updateOne({ jobId },{$set:  { status: 'running' }});
  } catch (dberr) {
    console.error(`Error updating job status for ${jobId}:`, dberr);
  }

  const uid = process.getuid();
  const gid = process.getgid();
  
  
     const dockerCommandArgs = [
        'run', '--rm', '--gpus', 'all',
        '-e', 'XLA_CLIENT_MEM_FRACTION=0.85',
        '--shm-size=8g',
        '-e', 'NUMBA_DISABLE_CACHE=1',
        '-v', '/home/mishra_lab/extra_disk/boltz_inputs:/inputs',
        `-v`, `/home/mishra_lab/extra_disk/boltz_outputs/${jobId}:/outputs`,
        'coreyhowe/boltz2',
        'boltz', 'predict', `/inputs/${filename}`,
        '--use_msa_server',
        '--out_dir', '/outputs'
];
    
    const proc = spawn('docker', dockerCommandArgs);

      proc.stdout.pipe(logStream);
      proc.stderr.pipe(logStream);

      proc.on('close', async (code) => {
        logStream.end();
        const logContent = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';

        if (code !== 0) {
          const errorLines = logContent.split('\n').filter(line =>
            /Error:|Exception:|failed:|CRITICAL|Fatal:/i.test(line)
          );
          let errorMsg = errorLines.length > 0
            ? errorLines[errorLines.length - 1].trim()
            : "Unexpected error occurred";
          const status = `failed: ${errorMsg}`;
          await BoltzJob.updateOne(
            { jobId },
            { $set: { status, failedAt: new Date() } }
          ).catch((err) => console.error(`Error updating error status for job ${jobId}:`, err));
          return resolve();
        } else if (code === 0) {
           const errorLines = logContent.split('\n').filter(line =>
            /Error:|Exception:|failed:|CRITICAL|Fatal:/i.test(line)
          );
          if (errorLines.length > 0) {
            let errorMsg = errorLines[errorLines.length - 1].trim();
            const status = `failed: ${errorMsg}`;
            await BoltzJob.updateOne(
              { jobId },
              { $set: { status, failedAt: new Date() } }
            ).catch((err) => console.error(`Error updating error status for job ${jobId}:`, err));
            return resolve();
          } else {
            await BoltzJob.updateOne(
              { jobId },
              { $set: { status: 'completed', completedAt: new Date() } }
            ).catch((err) => console.error(`Error updating job status for ${jobId}:`, err));
            return resolve();
          }
        }
      });
    } catch (error) {
      console.error(`Error executing docker job for ${jobId}:`, error);
      await redisClient.hSet(`job:${jobId}`, 'status', `failed: ${error.message}`);
      await BoltzJob.updateOne({ jobId }, { $set: { status: `failed: ${error.message}`, failedAt: new Date() } });
      return resolve();
    }
  });
}
    
  module.exports = runBoltzDockerJob;