import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Vis(){
    const [file, setFile] = useState(null);
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [downloadReady, setDownloadReady] = useState(false);

    const handleUpload = () => {
  const formData = new FormData();
  formData.append('file', file);

  fetch('http://localhost:5000/predict', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    console.log('Job started with ID:', data.jobId);
    setJobId(data.jobId);

    const eventSource = new EventSource(`http://localhost:5000/logs/${data.jobId}`);
    eventSource.onmessage = (event) => {
          setLogs(prevLogs => {
            const newLogs = [...prevLogs, event.data];
            // Detect if the logs mention download link
            if (event.data.includes('Prediction complete')) {
              setDownloadReady(true);
              eventSource.close(); // Stop listening
            }
            return newLogs;
          });
        };

        eventSource.onerror = (err) => {
          console.error('EventSource failed:', err);
          eventSource.close();
        };
      })
      .catch(console.error);
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

    return(
        <div>
  <input type="file" onChange={(e) => setFile(e.target.files[0])} />
  <button onClick={handleUpload}>Upload</button>

  <div style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '1rem' }}>
    {logs.map((line, index) => (
      <div key={index}>{line}</div>
    ))}
  </div>
  {downloadReady && (
    <button onClick={handleDownload} style={{marginTop:'1rem'}}>Download Results</button>
  )}
</div>
    );
}

export default Vis;