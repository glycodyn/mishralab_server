import React from 'react';
import Viewer from '../utils/viewer';

function JobViewer() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');
  if (!jobId) return <div>No jobId provided.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Structure Viewer for Job {jobId}</h2>
      <Viewer id={`molstar-viewer-${jobId}`} url={`http://172.25.11.91:5000/cif/${jobId}.cif`} />
    </div>
  );
}

export default JobViewer;