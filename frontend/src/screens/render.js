import React from 'react';
import Viewer from '../utils/viewer';

function JobViewer() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');
  if (!jobId) return <div>No jobId provided.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Structure Viewer for Job {jobId}</h2>
      <Viewer id={`molstar-viewer-${jobId}`} url={`${process.env.REACT_APP_API_URL}/cif/${jobId}.cif`} />
    </div>
  );
}

export default JobViewer;