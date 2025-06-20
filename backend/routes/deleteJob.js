const express = require('express');
const path = require('path');
const fs = require('fs');
const { JobRecord } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// DELETE /api/jobs/:jobId
router.delete('/:jobId', isAuthenticated, async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const job = await JobRecord.findByPk(jobId);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }
        
        // Get output directory path
        const outputDir = path.join(process.env.OUTPUT_DIR || './outputs', jobId);
        
        // Delete output directory if it exists
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
        
        // Delete job from database
        await job.destroy();
        
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Error deleting job', error: error.message });
    }
});

module.exports = router;