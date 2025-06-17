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
    <div
      id={id}
      ref={viewerRef}
      style={{
        width: '100%',
        height: 600,
        margin: '0 auto',
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#fff',
        overflow: 'visible',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative'
      }}
    />
  );
}

export default Viewer;