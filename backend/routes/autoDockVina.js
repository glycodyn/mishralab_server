const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const util = require('util');
const router = express.Router();

const exec = util.promisify(require('child_process').exec);

const UPLOAD_FOLDER = path.join(__dirname, '../uploads/docking');
const OUTPUT_FOLDER = path.join(__dirname, '../uploads/results');



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(UPLOAD_FOLDER)) {
            fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
        }
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const multiUpload = upload.fields([
    { name: 'receptor', maxCount: 1 },
    { name: 'ligand', maxCount: 1 },
    { name: 'config', maxCount: 1 }
  ]);
  
  router.post('/upload', upload.single('file'), (req, res) => {
      if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
  
      console.log('File uploaded:', req.file.path);
      res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          serverPath: req.file.path
      });
  });
  
//Helper functions for Vina and GlycoTorchVina and Vina-Carb
async function runAutoDockVina(receptorPath, ligandPath, configPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    const command = `docker run --rm -v "${path.dirname(receptorPath)}:/data" -v "${path.dirname(outputPath)}:/output" vina-test ` +
      `--receptor "/data/${path.basename(receptorPath)}" ` +
      `--ligand "/data/${path.basename(ligandPath)}" ` +
      `--config "/data/${path.basename(configPath)}" ` +
      `--out "/output/${path.basename(outputPath)}"`;

    console.log('Running AutoDock Vina (Docker) with:', command);

    try {
      const { stdout, stderr } = await exec(command);
      const scoreStart = stdout.indexOf("mode |   affinity");
      const scoreTable = scoreStart !== -1 ? stdout.slice(scoreStart).trim() : "Affinity data not found.";

      resolve({
        output: stdout + '\n' + stderr,
        scoreTable
      });
    } catch (error) {
      reject(error);
    }
  });
}


async function runGlycoTorchVina(receptorPath, ligandPath, configPath, outputPath, chiCoeff = 1, chiCutoff = 0) {
  return new Promise(async (resolve, reject) => {
    const command = `docker run --rm -v "${path.dirname(receptorPath)}:/data" -v "${path.dirname(outputPath)}:/output" glyco-test ` +
      `--receptor "/data/${path.basename(receptorPath)}" ` +
      `--ligand "/data/${path.basename(ligandPath)}" ` +
      `--config "/data/${path.basename(configPath)}" ` +
      `--out "/output/${path.basename(outputPath)}" ` +
      `--chi_coeff ${chiCoeff} --chi_cutoff ${chiCutoff}`;

    console.log('Running GlycoTorchVina (Docker) with:', command);

    try {
      const { stdout, stderr } = await exec(command);
      const scoreStart = stdout.indexOf("mode |   affinity");
      const scoreTable = scoreStart !== -1 ? stdout.slice(scoreStart).trim() : "Affinity data not found.";

      resolve({
        output: stdout + '\n' + stderr,
        scoreTable
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function runVinaCarb(receptorPath, ligandPath, configPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    const command = `docker run -v "${path.dirname(receptorPath)}:/data" -v "${path.dirname(outputPath)}:/output" vina-carb-test ./vina-carb ` +
      `--receptor "/data/${path.basename(receptorPath)}" ` +
      `--ligand "/data/${path.basename(ligandPath)}" ` +
      `--config "/data/${path.basename(configPath)}" ` +
      `--out "/output/${path.basename(outputPath)}"`;

    console.log('Running Vina-Carb with:', command);

    try {
      const { stdout, stderr } = await exec(command);

      const scoreStart = stdout.indexOf("mode |   affinity");
      const scoreTable = scoreStart !== -1 ? stdout.slice(scoreStart).trim() : "Affinity data not found.";

      resolve({
        output: stdout + '\n' + stderr,
        scoreTable
      });
    } catch (error) {
      reject(error);
    }
  });
}
//Routes

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
          outputPath,
          receptorPath,
          ligandPath,
          configPath,
          details: result.stdout,
          scoreTable: result.scoreTable
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

router.post('/upload-dock', multiUpload, async (req, res) => {
    console.log("Reached /upload-dock endpoint");
    console.log("FILES RECEIVED:", req.files);
    try {
      if (!req.files || !req.files.receptor || !req.files.ligand || !req.files.config) {
        return res.status(400).json({ success: false, message: 'All files (receptor, ligand, config) are required.' });
      }
  
      const receptorPath = req.files.receptor[0].path;
      const ligandPath = req.files.ligand[0].path;
      const configPath = req.files.config[0].path;
  
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
        details: result.output,
        scoreTable: result.scoreTable
      });
  
    } catch (error) {
      console.error('Docking error (multi):', error);
      res.status(500).json({
        success: false,
        message: 'Error running docking',
        error: error.message
      });
    }
  });

router.get('/download', (req, res) => {
    const filePath = req.query.path;
  
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
  
    res.download(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send('Error downloading file');
      }
    });
  });

router.post('/dock-glyco', async (req, res) => {
    try {
      const { receptorPath, ligandPath, configPath, chiCoeff, chiCutoff } = req.body;
  
      if (!receptorPath || !ligandPath || !configPath) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: receptorPath, ligandPath, and configPath are required'
        });
      }
  
      if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
      }
  
      const outputFileName = `glyco_result_${Date.now()}.pdbqt`;
      const outputPath = path.join(OUTPUT_FOLDER, outputFileName);
  
      const result = await runGlycoTorchVina(
        receptorPath,
        ligandPath,
        configPath,
        outputPath,
        chiCoeff ?? 1,
        chiCutoff ?? 0
      );
  
      res.status(200).json({
        success: true,
        message: 'GlycoTorch docking completed successfully',
        outputPath,
        receptorPath,
        ligandPath,
        configPath,
        chiCoeff,
        chiCutoff,
        details: result.output,
        scoreTable: result.scoreTable
      });
  
    } catch (error) {
      console.error('GlycoTorch docking error:', error);
      res.status(500).json({
        success: false,
        message: 'Error running GlycoTorch Vina',
        error: error.message
      });
    }
  });

router.post('/dock-carb', async (req, res) => {
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
  
      const outputFileName = `vinaCarb_result_${Date.now()}.pdbqt`;
      const outputPath = path.join(OUTPUT_FOLDER, outputFileName);
  
      const result = await runVinaCarb(receptorPath, ligandPath, configPath, outputPath);
  
      res.status(200).json({
        success: true,
        message: 'Vina-Carb docking completed successfully',
        outputPath,
        receptorPath,
        ligandPath,
        configPath,
        scoreTable: result.scoreTable,
        details: result.output,
        isVinaCarb: true
      });
  
    } catch (error) {
      console.error('Vina-Carb error:', error);
      res.status(500).json({
        success: false,
        message: 'Error running Vina-Carb',
        error: error.message
      });
    }
  });

router.get('/view', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(path.resolve(filePath));
  });
  
module.exports = router;