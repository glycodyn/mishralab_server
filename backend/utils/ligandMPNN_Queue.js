
class LigandMPNNJobQueue {
    constructor() {
      this.queue = [];
      this.isRunning = false;
      this.currentJobId = null;
    }
  
    add(jobFn, jobId) {
      jobFn.jobId = jobId; // attach jobId to function
      this.queue.push(jobFn);
      this.runNext();
    }
  
    async runNext() {
      if (this.isRunning || this.queue.length === 0) return;
  
      this.isRunning = true;
      const job = this.queue.shift();
      this.currentJobId = job.jobId; // store current job ID
      try {
        await job();
      } catch (err) {
        console.error("Job failed:", err);
      } finally {
        this.isRunning = false;
        this.currentJobId = null; // reset current job ID
        this.runNext();
      }
    }
  }
  
  module.exports = new LigandMPNNJobQueue();
 
