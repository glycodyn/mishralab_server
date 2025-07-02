const { exec, spawn } = require('child_process');

class VRAMJobQueue {
  constructor(minVRAM = 614.4) {
    this.queue = [];
    this.runningJobs = [];
    this.minVRAM = minVRAM; // Minimum VRAM (MB) required per job
    this.checking = false;
  }

  add(jobFn, jobId) {
    this.queue.push({ jobFn, jobId });
    this.tryRunJobs();
  }

  async tryRunJobs() {
    if (this.checking) return;
    this.checking = true;

    while (this.queue.length > 0) {
      const freeVRAM = await this.getAvailableVRAM();
      console.log(`Available VRAM: ${freeVRAM} MB`);
      if (freeVRAM >= this.minVRAM) {
        const { jobFn, jobId } = this.queue.shift();
        this.runningJobs.push(jobId);
        jobFn().finally(() => {
          this.runningJobs = this.runningJobs.filter(id => id !== jobId);
          this.tryRunJobs();
        });
      } else {
        console.log(`Not enough VRAM to run job. Required: ${this.minVRAM} MB, Available: ${freeVRAM} MB`);
        break; // Not enough VRAM, wait for jobs to finish
      }
    }
    this.checking = false;
  }

  getAvailableVRAM() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec("nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits", (err, stdout) => {
        if (err) return resolve(0);
        const freeMemories = stdout.trim().split('\n').map(Number);
        const totalFree = freeMemories.reduce((a, b) => a + b, 0);
        resolve(totalFree);
      });
    });
  }
}

module.exports = new VRAMJobQueue();