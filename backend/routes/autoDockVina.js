const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const util = require('util');
const router = express.Router();

const exec = util.promisify(require('child_process').exec);

// Configure storage for uploaded files
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

// Helper function to run AutoDock Vina
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


})