import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Vis(){
    const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId || !email) return;

    const interval = setInterval(() => {
      // 1. Get job status
      fetch(`http://localhost:5000/jobs/${email}`)
        .then(res => res.json())
        .then(data => {
          const job = data.find(j => j.jobId === jobId);
          if (job) setStatus(job.status);
        });

      // 2. Get queue position
      fetch(`http://localhost:5000/position/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (data.running) setPosition(0); // currently running
          else setPosition(data.position);  // still in queue
        });
    }, 5000);

    return () => clearInterval(interval);
}, [jobId, email]);

const handleUpload = () => {

    if (!file || !email) {
        setError('Please select a file and enter your email.');
        return;
        }
        setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

  fetch('http://localhost:5000/predict', {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => {
  setJobId(data.jobId);
  setStatus('queued');
  setPosition(null);
})
.catch(err => {
  console.error(err);
  setError('Failed to upload file.');
});
  };

const handleDownload = () => {
    if (!jobId) return;
    const link = document.createElement('a');
    link.href = `http://localhost:5000/download/${jobId}.zip`;
    link.setAttribute('download', `${jobId}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="vis-container">
      <h2>AlphaFold3 Job Submission</h2>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginRight: '1rem' }}
      />

      <input
        type="file"
        onChange={e => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} style={{ marginLeft: '1rem' }}>Upload</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {jobId && (
        <div style={{ marginTop: '1rem', background: '#eef', padding: '1rem' }}>
          <p><strong>Job ID:</strong> {jobId}</p>
          <p><strong>Status:</strong> {status}</p>
          {status === 'queued' && position !== null && (
            <p><strong>Queue Position:</strong> {position}</p>
          )}
          {status === 'completed' && (
            <button onClick={handleDownload} style={{ marginTop: '1rem' }}>
              Download Results
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Vis;