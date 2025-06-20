const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const util = require('util');
const router = express.Router();

const exec = util.promisify(require('child_process').exec);

const UPLOAD_FOLDER = '/home/mishra_lab/extra_disk/AutoDockVina_uploads';
const OUTPUT_FOLDER = '/home/mishra_lab/extra_disk/AutoDockVina_outputs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/docking');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Helper function : AutoDock Vina
async function runAutoDockVina(receptorPath, ligandPath, configPath, outputPath) {
    return new Promise((resolve, reject) => {
        const vina = spawn('vina', [
            '--receptor', receptorPath,
            '--ligand', ligandPath,
            '--config', configPath,
            '--out', outputPath
        ]);
        
        let stdout = '';
        let stderr = '';
        
        vina.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        vina.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        vina.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`AutoDock Vina exited with code ${code}: ${stderr}`));
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

router.post('/dock', async (req, res) => {
    try {
        const { receptorPath, ligandPath, configPath } = req.body;
        
        if (!receptorPath || !ligandPath || !configPath) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required parameters: receptorPath, ligandPath, and configPath are required' 
            });
        }
        
        if (!fs.existsSync(OUTPUT_FOLDER)) {
            fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
        }
        
        const outputFileName = `result_${Date.now()}.pdbqt`;
        const outputPath = path.join(OUTPUT_FOLDER, outputFileName);
        
        const result = await runAutoDockVina(receptorPath, ligandPath, configPath, outputPath);
        
        res.status(200).json({
            success: true,
            message: 'Docking completed successfully',
            outputPath: outputPath,
            details: result.stdout
        });
    } catch (error) {
        console.error('Docking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error running AutoDock Vina',
            error: error.message
        });
    }
});

module.exports = router;