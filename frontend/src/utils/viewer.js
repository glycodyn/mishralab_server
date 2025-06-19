import React, { useEffect, useRef } from 'react';
import { loadStructure, initViewer } from './viewer-utils';
import { fetchPLDDTArray } from './fetchJson';

function Viewer({ url, format = 'mmcif', id = 'molstar-viewer' }) {
  const viewerRef = useRef(null);
  const pluginRef = useRef(null);
  let jobId = new URLSearchParams(window.location.search).get('jobId');
  jobId = jobId.trim();

  useEffect(() => {
    let disposed = false;

    const setupViewer = async () => {
      const plddtArray = await fetchPLDDTArray(jobId);
      if (disposed) return;
      if (viewerRef.current && !pluginRef.current) {
        const plugin = await initViewer(viewerRef.current, { plddtArray });
        pluginRef.current = plugin;
        await loadStructure(plugin, jobId, url, { format, plddtArray });
      }
    };

    setupViewer();

    return () => {
      disposed = true;
      pluginRef.current?.dispose();
      pluginRef.current = null;
    };
  }, [url, jobId, format, id]);

 return (
    <div>
      {/* Only this div will be fullscreen */}
      <div
        id={id}
        ref={viewerRef}
        style={{
          width: '100%',
          height: '600px',
          margin: '0 auto',
          border: '1px solid #ccc',
          borderRadius: 8,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          
        }}
      />
      {/* Legend stays outside fullscreen */}
      <div className="plddt-legend" style={{ marginTop: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', background: '#fafcff', maxWidth: 400 }}>
        <h5 style={{ marginTop: 0, marginBottom: 8 }}>pLDDT Confidence Legend:</h5>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#2166AC', marginRight: 10 }}></div>
          <span>Very high (pLDDT ≥ 90)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#67A9CF', marginRight: 10 }}></div>
          <span>Confident (pLDDT 70-90)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#EF8A62', marginRight: 10 }}></div>
          <span>Medium (pLDDT 50-70)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#B2182B', marginRight: 10 }}></div>
          <span>Low (pLDDT &lt; 50)</span>
        </div>
      </div>
    </div>
  );
}


export default Viewer;