import React from "react";
import Viewer from '../utils/boltzViewer'

function BoltzViewer() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('jobId');
  if (!jobId) return <div style={{ padding: 24 }}>No job selected.</div>;
  const cifUrl = `${process.env.REACT_APP_API_URL}/boltz/cif/${jobId}`;
  return (
    <div style={{ padding: 24 }}>
      <h2>Boltz2 Structure Viewer</h2>
      <Viewer url={cifUrl} id="boltz-molstar-viewer" />
    </div>
  );
}

export default BoltzViewer;