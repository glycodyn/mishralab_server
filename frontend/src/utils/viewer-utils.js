// molstar-utils.js
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';  
import { registerPLDDTTheme } from './colorTheme';
import 'molstar/lib/mol-plugin-ui/skin/light.scss'


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
  },
  

      colorThemes: [
       {
          name: 'json-plddt', 
         provider: 'custom'
       }
      ],
      defaults:{
        structure: {
            representationPreset: 'default',
            representationColorTheme: 'json-plddt',
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
        isExpanded: true,  // Expanded
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
        // Disable standard fullscreen toggle which would try to make it browser-fullscreen
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

  // Force the layout to take full size of container
  setTimeout(() => {
     const container = parent.querySelector('.msp-plugin');
        if (container) {
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
        }
        
        // Force bottom region to be collapsed and right region to be expanded
        const bottomPanel = parent.querySelector('.msp-layout-region-bottom');
        if (bottomPanel) {
            bottomPanel.style.display = 'none';
        }
        
        const rightPanel = parent.querySelector('.msp-layout-region-right');
        if (rightPanel) {
            rightPanel.style.display = 'block';
            rightPanel.style.width = '300px'; // Or whatever width you prefer
        }
        
        // Update layout state
        plugin.layout.setProps({
            regionState: {
                bottom: 'hidden',
                left: 'hidden',
                right: 'full',
                top: 'hidden'
            }
    });
  }, 100);

    const plddtTheme = registerPLDDTTheme(plddtArray);
  const registry = plugin.representation.structure.themes.colorThemeRegistry;
  if (!registry.has('json-plddt')) {
    registry.add(plddtTheme);
  }

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
export async function loadStructure(plugin, jobId, url, options) {
  const plddtArray = options?.plddtArray; // Use the array passed from Viewer

  // Remove previous structures
  await plugin.clear();

  // Download and parse
  const data = await plugin.builders.data.download({ url, isBinary: options?.isBinary });
  const trajectory = await plugin.builders.structure.parseTrajectory(data, options?.format ?? 'mmcif');

  // Use the UI preset to load the structure with full UI interactivity
  const preset = plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
 await preset;

const state = plugin.state.data;
let reprs = [];
for (let i = 0; i < 30; i++) { // try for up to ~3s
  reprs = state.selectQ(q => q.ofType('structure-representation'));
  if (reprs.length > 0) break;
  await new Promise(res => setTimeout(res, 100));
}
console.log(
  'State objects after preset:',
  Array.from(state.cells.values()).map(c => c.obj?.type?.name)
);
if (reprs.length === 0) {
  console.warn('No representations found after waiting. Creating one manually.');
  const structures = state.selectQ(q => q.ofType('structure'));
  if (structures.length > 0) {
    await plugin.builders.structure.representation.addRepresentation(
      structures[0],
      { type: 'cartoon', color: 'json-plddt' }
    );
    // Wait for the representation to appear
    for (let i = 0; i < 10; i++) {
      reprs = state.selectQ(q => q.ofType('structure-representation'));
      if (reprs.length > 0) break;
      await new Promise(res => setTimeout(res, 100));
    }
    console.log('Manually created representation:', reprs);
  }
}

  console.log('Applying color theme to representations:', reprs);
  for (const repr of reprs) {
    await state.update(repr).update({
      color: 'json-plddt'
      // colorParams: { plddtArray }
    }).commit();
  }

  await plugin.managers.camera.reset();
  try {
    await plugin.managers.camera.autoFocus();
  } catch (focusError) {
    await plugin.managers.camera.reset();
  }
}