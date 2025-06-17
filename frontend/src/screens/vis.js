import React, { useState, useEffect } from "react";
import Viewer from "../utils/viewer";
import '../styles/vis.css'

function Vis() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState(() => sessionStorage.getItem('email') || '');
  const [fastaText, setFastaText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobId, setJobId] = useState(() => sessionStorage.getItem('jobId') || null);
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewCifJobId, setViewCifJobId] = useState(null);


  useEffect(() => {
    if (email) sessionStorage.setItem('email', email);
    if (jobId) sessionStorage.setItem('jobId', jobId);
  }, [email, jobId]);

  useEffect(() => {
    if (!jobId) sessionStorage.removeItem('jobId');
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !email) return;
    const interval = setInterval(() => {
      fetch(`http://172.25.15.192:5000/jobs/${email}`)
        .then(res => res.json())
        .then(data => {
          const job = data.find(j => j.jobId === jobId);
          if (job) setStatus(job.status);
        });
      fetch(`http://172.25.15.192:5000/position/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (data.running) setPosition(0);
          else setPosition(data.position);
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId, email]);

   const handleUpload = () => {
    if ((!file && !fastaText.trim()) || !email) {
      setError('Please select a file or paste FASTA, and enter your email.');
      return;
    }
    setError('');
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (fastaText.trim()) {
      // blob the FASTA text
      const fastaBlob = new Blob([fastaText], { type: 'text/plain' });
      formData.append('file', fastaBlob, 'input.fasta');
    }
    formData.append('email', email);
    formData.append('jobTitle', jobTitle);

    fetch('http://172.25.15.192:5000/predict', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setJobId(data.jobId);
        setStatus('queued');
        setPosition(null);
      })
      .catch(() => setError('Failed to upload file.'));
  };

 

  const handleDownload = (downloadJobId) => {
    const id = downloadJobId || jobId;
    if (!id) return;
    const link = document.createElement('a');
    link.href = `http://172.25.15.192:5000/download/${id}`;
    link.setAttribute('download', `${id}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = () => {
    if (!searchEmail) return;
    fetch(`http://172.25.15.192:5000/jobs/${searchEmail}`)
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .catch(() => setSearchResults([]));
  };

  

  return (
    <div className="vis-container">
      <h2>AlphaFold3 Job Submission</h2>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

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
          onChange={e => {
            setFile(e.target.files[0]);
            setFastaText(''); 
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

      <h3>Search Jobs by Email</h3>
      <input
        type="email"
        placeholder="Enter email to search"
        value={searchEmail}
        onChange={e => setSearchEmail(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

{searchResults.length > 0 && (
  <div className="vis-search-results" style={{ marginTop: '1rem' }}>
    <h4>Jobs for {searchEmail}:</h4>
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
        
          <h4>Structure Viewer for Job {viewCifJobId}</h4>
          {viewCifJobId && (
          <Viewer   id={`molstar-viewer-${viewCifJobId}`}url={`http://172.25.15.192:5000/cif/${viewCifJobId}.cif`}  />  )}       
          {/* Add pLDDT color legend */}
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
              <span>Low (pLDDT &lt 50)</span>
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
)}
   


    </div>
  );

}
export default Vis