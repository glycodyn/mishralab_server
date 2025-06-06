class JobQueue {
    constructor() {
      this.queue = [];
      this.isRunning = false;
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
      try {
        await job();
      } catch (err) {
        console.error("Job failed:", err);
      } finally {
        this.isRunning = false;
        this.runNext();
      }
    }
  }
  
  module.exports = new JobQueue();
  