import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import '../styles/ligandMPNN.css';
import { useAuth } from '../context/authCOntext';

const MODEL_OPTIONS = [
  { label: 'LigandMPNN', value: 'ligand_mpnn' },
  { label: 'ProteinMPNN', value: 'protein_mpnn' },
  { label: 'SolubleMPNN', value: 'soluble_mpnn' },
  { label: 'ProteinMPNN (global membrane label)', value: 'global_label_membrane_mpnn' },
  { label: 'ProteinMPNN (per residue membrane label)', value: 'per_residue_label_membrane_mpnn' }
];

const LIGAND_CHECKPOINTS = [
  { label: '0.05A noise', value: './model_params/ligandmpnn_v_32_005_25.pt' },
  { label: '0.10A noise', value: './model_params/ligandmpnn_v_32_010_25.pt' },
  { label: '0.20A noise', value: './model_params/ligandmpnn_v_32_020_25.pt' },
  { label: '0.30A noise', value: './model_params/ligandmpnn_v_32_030_25.pt' }
];

const PROTEIN_CHECKPOINTS = [
  { label: '0.02A noise', value: './model_params/proteinmpnn_v_48_002.pt' },
  { label: '0.10A noise', value: './model_params/proteinmpnn_v_48_010.pt' },
  { label: '0.20A noise', value: './model_params/proteinmpnn_v_48_020.pt' },
  { label: '0.30A noise', value: './model_params/proteinmpnn_v_48_030.pt' }
];

const Soluble_CHECKPOINTS = [
  { label: '0.02A noise', value: './model_params/solublempnn_v_48_002.pt' },
  { label: '0.10A noise', value: './model_params/solublempnn_v_48_010.pt' },
  { label: '0.20A noise', value: './model_params/solublempnn_v_48_020.pt' },
  { label: '0.30A noise', value: './model_params/solublempnn_v_48_030.pt' }
];

const LigandMPNNScreen = () => {
  const { user } = useAuth();
  const email = user?.email || '';
  const userId = user?._id || '';

  const [pdbFile, setPdbFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [seed, setSeed] = useState('');
  const [modelType, setModelType] = useState('ligand_mpnn');
  const [checkpoint, setCheckpoint] = useState('');
  const [temperature, setTemperature] = useState('');
  const [verbose, setVerbose] = useState(false);
  const [saveStats, setSaveStats] = useState(false);
  const [packSideChains, setPackSideChains] = useState(false);
  const [numberOfBatches, setNumberOfBatches] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleFileChange = (e) => setPdbFile(e.target.files[0]);

  const getCheckpointOptions = () => {
    if (modelType === 'ligand_mpnn') return LIGAND_CHECKPOINTS;
    if (modelType === 'protein_mpnn') return PROTEIN_CHECKPOINTS;
    if (modelType === 'soluble_mpnn') return Soluble_CHECKPOINTS;
    return [];
  };

  // Fetch LigandMPNN jobs for logged-in user
  useEffect(() => {
    if (!email) return;
    let isMounted = true;
    const fetchJobs = () => {
      fetch(`${process.env.REACT_APP_API_URL}/ligandmpnn/jobs/${email}`)
        .then(res => res.json())
        .then(data => { if (isMounted) setSearchResults(data); })
        .catch(() => { if (isMounted) setSearchResults([]); });
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [email, result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!pdbFile) {
      setError('Please upload a PDB file.');
      setLoading(false);
      return;
    }
    if (!jobTitle.trim()) {
      setError('Please enter a job title.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', pdbFile);
    formData.append('model_type', modelType);
    formData.append('email', email);
    formData.append('userId', userId);
    formData.append('jobTitle', jobTitle);
    if (seed) formData.append('seed', seed);
    if (checkpoint) {
      if (modelType === 'ligand_mpnn') formData.append('checkpoint_ligand_mpnn', checkpoint);
      if (modelType === 'protein_mpnn') formData.append('checkpoint_protein_mpnn', checkpoint);
      if (modelType === 'soluble_mpnn') formData.append('checkpoint_soluble_mpnn', checkpoint);
    }
    if (temperature) formData.append('temperature', temperature);
    if (verbose) formData.append('verbose', 0);
    if (saveStats) formData.append('save_stats', 1);
    if (packSideChains) formData.append('pack_side_chains', 1);
    if (numberOfBatches) formData.append('number_of_batches', numberOfBatches);
    if (batchSize) formData.append('batch_size', batchSize);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ligandmpnn/run`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Job submission failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (jobId) => {
    const id =  jobId;
    if (!id) return;
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL}/ligandmpnn/download/${id}`;
    link.setAttribute('download', `${id}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAlphafoldPipeline = async (jobId) =>{
    const response = await fetch(`${process.env.REACT_APP_API_URL}/ligandmpnn/sequence/${jobId}`);
    if (!response.ok) {
      console.error('Failed to fetch sequence:', response.statusText);
      return;
    }
    const fastaText = await response.text();
    const lines = fastaText.split('\n');

    let firstHeaderIndex = lines.findIndex(line => line.startsWith('>'));

    let secondHeaderIndex = -1;
    for (let i = firstHeaderIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith('>')) {
            secondHeaderIndex = i;
            break;
        }
    }

    let processedFasta = '';
    if (secondHeaderIndex !== -1) {
        processedFasta = lines.slice(secondHeaderIndex).join('\n');
    } else {
        
        processedFasta = '';
    }
    const fastaBlob = new Blob([processedFasta], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', fastaBlob, `${jobId}.fa`);
    formData.append('jobId', jobId);
    formData.append('email', email);
    formData.append('userId', userId);
    formData.append('jobTitle', `AlphaFold from LigandMPNN ${jobId}`);

    const submitResponse = await fetch(`${process.env.REACT_APP_API_URL}/predict`, {
        method: 'POST',
        body: formData
    });
    const data = await submitResponse.json();
    if (!submitResponse.ok) {
        setError(data.error || 'AlphaFold job submission failed');
        return;
    }
    alert('AlphaFold job submitted successfully! You can check the status in the AlphaFold Jobs section.');
  }

  return (
    <div className="vis-container">
      <h2 style={{ color: '#0000cd' }}>LigandMPNN Job Submission</h2>
      <input
        type="text"
        placeholder="Enter job title"
        value={jobTitle}
        onChange={e => setJobTitle(e.target.value)}
        className="ligandmpnn-input"
      />
      <div style={{ margin: '1em 0' }}>
        <label>
          <strong>PDB File:</strong>
          <input
            type="file"
            accept=".pdb"
            onChange={handleFileChange}
            required
            className="ligandmpnn-input"
            style={{ marginTop: '0.5em' }}
          />
        </label>
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Model Type</label>
        <select
          value={modelType}
          onChange={e => { setModelType(e.target.value); setCheckpoint(''); }}
          className="ligandmpnn-input"
        >
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Checkpoint (optional)</label>
        <select
          value={checkpoint}
          onChange={e => setCheckpoint(e.target.value)}
          className="ligandmpnn-input"
        >
          <option value="">Default</option>
          {getCheckpointOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Seed (optional)</label>
        <input
          type="number"
          placeholder="Random seed"
          value={seed}
          onChange={e => setSeed(e.target.value)}
          className="ligandmpnn-input"
        />
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Temperature (optional)</label>
        <input
          type="number"
          step="0.01"
          placeholder="e.g. 0.05"
          value={temperature}
          onChange={e => setTemperature(e.target.value)}
          className="ligandmpnn-input"
        />
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Number of Batches (optional)</label>
        <input
          type="number"
          placeholder="e.g. 5"
          value={numberOfBatches}
          onChange={e => setNumberOfBatches(e.target.value)}
          className="ligandmpnn-input"
        />
      </div>
      <div className="ligandmpnn-form-group">
        <label className="ligandmpnn-label">Batch Size (optional)</label>
        <input
          type="number"
          placeholder="e.g. 3"
          value={batchSize}
          onChange={e => setBatchSize(e.target.value)}
          className="ligandmpnn-input"
        />
      </div>
      <div className="ligandmpnn-checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={saveStats}
            onChange={e => setSaveStats(e.target.checked)}
          /> Save stats
        </label>
        <label>
          <input
            type="checkbox"
            checked={packSideChains}
            onChange={e => setPackSideChains(e.target.checked)}
          /> Pack side chains
        </label>
      </div>
      <Button variant="primary" type="submit" disabled={loading} className="ligandmpnn-submit-btn" onClick={handleSubmit}>
        {loading ? <Spinner animation="border" size="sm" /> : 'Submit Job'}
      </Button>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      {result && (
        <Alert variant="success" className="mt-3">
          {result.message || 'Job submitted successfully!'}
          {result.output && (
            <pre className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{result.output}</pre>
          )}
        </Alert>
      )}

      <hr />

      <h3>Your LigandMPNN Jobs</h3>
      {searchResults.length > 0 ? (
        <div className="vis-search-results" style={{ marginTop: '1rem' }}>
          <ul>
            {searchResults.map(job => (
              <li key={job.jobId} className="vis-job-box">
                <strong>{job.jobTitle || job.jobId}</strong>
                <br />
                Job ID: {job.jobId}
                <br />
                Status: {job.status}
                <br />
                Submitted: {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                {job.status === 'completed' && (
                  <>
                    <button
                      style={{ marginLeft: '1rem' }}
                      onClick={() => handleDownload(job.jobId)}
                    >
                      Download
                    </button>
                    <button
                      style={{ marginLeft: '1rem' }}
                      onClick={() => handleAlphafoldPipeline(job.jobId)}
                    >
                      Run AlphaFold Pipeline
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No jobs found.</p>
      )}
    </div>
  );
};

export default LigandMPNNScreen;