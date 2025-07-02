import React, { useState, useEffect } from "react";
import Viewer from "../utils/viewer";
import '../styles/vis.css'
import { useAuth } from "../context/authCOntext";

function Vis() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [fastaText, setFastaText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobId, setJobId] = useState(() => sessionStorage.getItem('jobId') || null);
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewCifJobId, setViewCifJobId] = useState(null);

  // Use logged-in user's email
  const email = user?.email || '';
  const userId = user?._id || '';

  useEffect(() => {
    if (jobId) sessionStorage.setItem('jobId', jobId);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) sessionStorage.removeItem('jobId');
  }, [jobId]);

  const validateFasta = (text) => {
    const lines = text.split('\n');
    return lines.length >=2 && lines[0].startsWith('>') && lines.slice(1).some(line => /^[A-Za-z]+$/.test(line.trim())); 
  }

  const validateFile = (file) => {
    if (!file) return false;
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.fasta', '.fa', '.txt','.json'];
    const isValidExtension =  validExtensions.some(ext => fileName.endsWith(ext));
    if(!isValidExtension){
      throw new Error('Invalid file type. Only FASTA (.fasta, .fa) and JSON (.json) files are accepted.');
    }
    return true
  };

  // Fetch jobs for logged-in user automatically
useEffect(() => {
  if (!email) return;
  let isMounted = true;
  const fetchJobs = () => {
    fetch(`${process.env.REACT_APP_API_URL}/jobs/${email}`)
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
}, [email]);

  // Poll for job status updates
useEffect(() => {
  if (!jobId || !email) return;
  let isMounted = true;
  const pollStatus = () => {
    fetch(`${process.env.REACT_APP_API_URL}/jobs/${email}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setSearchResults(data);
        const job = data.find(j => j.jobId === jobId);
        if (job) setStatus(job.status);
      });
    fetch(`${process.env.REACT_APP_API_URL}/position/${jobId}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.running) setPosition(0);
        else setPosition(data.position);
      });
  };
  pollStatus();
  const interval = setInterval(pollStatus, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [jobId, email]);

  const handleUpload = () => {
    if ((!file && !fastaText.trim()) || !email) {
      setError('Please select a file or paste FASTA.');
      return;
    }

    if (fastaText.trim() && !validateFasta(fastaText)) {
      setError('Invalid FASTA format. Please ensure it starts with ">" and contains valid sequence lines.');
      return;
    }

    if (file && !validateFile(file)) {
      setError('Only FASTA (.fasta, .fa) and JSON (.json) files are accepted.');
      setFile(null);
      return;
    }

    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    setError('');
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (fastaText.trim()) {
      const fastaBlob = new Blob([fastaText], { type: 'text/plain' });
      formData.append('file', fastaBlob, 'input.fasta');
    }
    formData.append('email', email);
    formData.append('userId', userId);
    formData.append('jobTitle', jobTitle);
    fetch(`${process.env.REACT_APP_API_URL}/predict`, {
      method: 'POST',
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('File too large. Please upload a smaller file.');
        } else if (res.status === 400) {
          return res.json().then(err => {
            throw new Error(err.error || 'Invalid request. Please check your input.');
          });
        } else if (res.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else if (res.status >= 500) {
          throw new Error('Server error. Our team has been notified.');
        } else {
          throw new Error(`Request failed with status: ${res.status}`);
        }
      }
      return res.json();
    })
    .then(data => {
      setJobId(data.jobId);
      setStatus('queued');
      setPosition(null);
      setError('');
    })
    .catch(err => {
      console.error('Upload error:', err);
      setError(`Failed to upload file: ${err.message || 'Unknown error occurred'}`);
    });
  };

  const handleDownload = (downloadJobId) => {
    const id = downloadJobId || jobId;
    if (!id) return;
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL}/download/${id}`;
    link.setAttribute('download', `${id}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="vis-container">
      <h2 style={{ color: '#0000cd' }}>AlphaFold3 Job Submission</h2>

      <input
        type="text"
        placeholder="Enter job title"
        value={jobTitle}
        onChange={e => setJobTitle(e.target.value)}
      />

      <div style={{ margin: '1em 0' }}>
        <label>
          <strong>Paste FASTA content:</strong>
          <textarea
            rows={8}
            style={{ width: '100%', marginTop: '0.5em' }}
            placeholder="Paste your FASTA file content here..."
            value={fastaText}
            onChange={e => {
              setFastaText(e.target.value);
              if (e.target.value) setFile(null);
            }}
          />
        </label>
      </div>

      <div>
        <strong>Or upload a file:</strong>
        <input
          type="file"
          accept=".fasta,.fa,.json"
          onChange={e => {
            try {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                if (!validateFile(selectedFile)) {
                  setError('Only FASTA (.fasta, .fa) and JSON (.json) files are accepted.');
                  e.target.value = '';
                  return;
                }
                if (selectedFile.size > 20 * 1024 * 1024) {
                  setError('File size exceeds 5MB limit');
                  return;
                }
                setFile(selectedFile);
                setFastaText('');
                setError('');
              }
            } catch (err) {
              setError(`File upload error: ${err.message}`);
              e.target.value = '';
            }
          }}
        />
      </div>

      <button onClick={handleUpload}>Upload</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {jobId && (
        <div style={{ marginTop: '1rem', background: '#eef', padding: '1rem', borderRadius: '7px' }}>
          <p><strong>Job ID:</strong> {jobId}</p>
          <p><strong>Status:</strong> {status}</p>
          {status === 'queued' && position !== null && (
            <p><strong>Queue Position:</strong> {position}</p>
          )}
          {status === 'completed' && (
            <button onClick={() => handleDownload()} style={{ marginTop: '1rem' }}>
              Download Results
            </button>
          )}
        </div>
      )}

      <hr />

      <h3>Your Jobs</h3>
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
                      onClick={() => window.open(`/viewer?jobId=${job.jobId}`, '_blank', 'noopener,noreferrer')}
                    >
                      View
                    </button>
                    {viewCifJobId === job.jobId && (
                      <div style={{ margin: '2em 0' }}>
                        <h4>Structure Viewer for Job {job.jobTitle}</h4>
                        {viewCifJobId && (
                          <div className="viewer-wrapper">
                            <Viewer id={`molstar-viewer-${viewCifJobId}`} url={`${process.env.REACT_APP_API_URL}/cif/${viewCifJobId}.cif`} />
                          </div>
                        )}
                        <div className="plddt-legend" style={{ marginTop: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                          <h5 style={{ marginTop: '0', marginBottom: '8px' }}>pLDDT Confidence Legend:</h5>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#2166AC', marginRight: '10px' }}></div>
                            <span>Very high (pLDDT ≥ 90)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#67A9CF', marginRight: '10px' }}></div>
                            <span>Confident (pLDDT 70-90)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#EF8A62', marginRight: '10px' }}></div>
                            <span>Medium (pLDDT 50-70)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#B2182B', marginRight: '10px' }}></div>
                            <span>Low (pLDDT &lt; 50)</span>
                          </div>
                        </div>
                        <button onClick={() => setViewCifJobId(null)} style={{ marginTop: '1em' }}>Close Viewer</button>
                      </div>
                    )}
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
}

export default Vis;