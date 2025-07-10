import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';  
import React, { useEffect, useRef } from 'react';

/**
 * Initialize Mol* viewer on given element.
 * @param {string|HTMLDivElement} element - DOM element or element ID to attach viewer.
 * @param {Object} [options]
 * @param {Object} [options.spec] - Optional Mol* plugin specification.
 * @returns {Promise<PluginContext>} - Returns the initialized plugin instance.
 */

const sharedUISpec = {
  ...DefaultPluginUISpec(),
  layout: {
    initial: {
      isExpanded: false,
      isFullScreen: true,
      isResizable: true,
      showControls: true,
      regionState: {
        bottom: 'hidden',
        left: 'hidden',
        right: 'full',
        top: 'hidden'
      }
    }
  }
}
  

export async function initViewer(elementOrId, options) {
    const plddtArray = options?.plddtArray;
   
  const parent = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!parent) throw new Error('Element not found');

  
  while (parent.firstChild) parent.removeChild(parent.firstChild);


  

    const spec = options?.spec || {
    ...sharedUISpec,
    layout: {
      initial: {
        isExpanded: true,  
        isFullScreen: true,
        showControls: true,
        regionState: {
          bottom: 'hidden',
          left: 'hidden', 
          right: 'full',
          top: 'hidden'
        }
      },
      controls: { 
        fullscreenOnInit: true,
        enableFullscreen: false
      }
    },
    config: []
  };
  
  console.log('Initializing Mol* viewer with spec:', spec);
  const plugin = await createPluginUI({
    target: parent,
    spec: spec,
    render: renderReact18
  });
  setTimeout(() => {
     const container = parent.querySelector('.msp-plugin');
        if (container) {
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
        }
        const bottomPanel = parent.querySelector('.msp-layout-region-bottom');
        if (bottomPanel) {
            bottomPanel.style.display = 'none';
        }
        const rightPanel = parent.querySelector('.msp-layout-region-right');
        if (rightPanel) {
            rightPanel.style.display = 'block';
            rightPanel.style.width = '300px';
        }
        
        plugin.layout.setProps({
            regionState: {
                bottom: 'hidden',
                left: 'hidden',
                right: 'full',
                top: 'hidden'
            }
    });
  }, 100);
  return plugin;
}

/**
 * Load a structure into the Mol* plugin.
 * @param {PluginContext} plugin - Initialized plugin instance.
 * @param {string} url - URL to the structure file.
 * @param {Object} [options]
 * @param {string} [options.format] - Format of the structure file, e.g. 'mmcif'.
 * @param {boolean} [options.isBinary] - Whether the file is binary.
 * @returns {Promise<Object>} - Returns the applied preset object.
 */
export async function loadStructure(plugin, url, options) {
  await plugin.clear();
  const data = await plugin.builders.data.download({ url, isBinary: options?.isBinary });
  const trajectory = await plugin.builders.structure.parseTrajectory(data, options?.format ?? 'mmcif');
  const preset = plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
  await preset;


  await plugin.managers.camera.reset();
  try {
    await plugin.managers.camera.autoFocus();
  } catch (focusError) {
    await plugin.managers.camera.reset();
  }
}




function Viewer({ url, format = 'mmcif', id = 'molstar-viewer' }) {
  const viewerRef = useRef(null);
  const pluginRef = useRef(null);
  let jobId = new URLSearchParams(window.location.search).get('jobId');
  jobId = jobId.trim();

  useEffect(() => {
    let disposed = false;

    const setupViewer = async () => {
      if (disposed) return;
      if (viewerRef.current && !pluginRef.current) {
        const plugin = await initViewer(viewerRef.current);
        pluginRef.current = plugin;
        await loadStructure(plugin, url,);
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
          height: '800px',
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
      
    </div>
  );
}


export default Viewer;