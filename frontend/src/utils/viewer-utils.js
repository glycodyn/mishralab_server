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
      isExpanded: true,
      isFullScreen: false,
      isResizable: true,
      showControls: true,
      regionState: {
        bottom: 'full',
        left: 'full',
        right: 'full',
        top: 'full'
      }
    }
  },
  // Add this section:

    //  colorThemes: [
    //    {
    //      name: 'my-plddt', // <-- your custom theme name
    //      provider: 'my-plddt'
    //    }
    //  ]
    }
  


export async function initViewer(elementOrId, options) {
    const plddtArray = options?.plddtArray;
    registerPLDDTTheme(plddtArray);
  const parent = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!parent) throw new Error('Element not found');

  // Remove old children (if any)
  while (parent.firstChild) parent.removeChild(parent.firstChild);


  

  const spec = options?.spec || {
    ...sharedUISpec,
    config: [
      // VolumeStreaming config would go here if needed
    ]
  };
  console.log('Initializing Mol* viewer with spec:', spec);
  const plugin = await createPluginUI({
       target: parent,
       spec: spec,
       render: renderReact18
     });
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

  // Update the cartoon representation to use the custom color theme
  const state = plugin.state.data;
  const reprs = state.selectQ(q =>
    q.ofType('structure-representation')
     .filter(r => r.params?.type?.name === 'cartoon')
  );
  for (const repr of reprs) {
    await state.update(repr).update({
      color: 'json-plddt',
      colorParams: { plddtArray }
    }).commit();
  }

  // Focus camera
  await plugin.managers.camera.reset();
  try {
    await plugin.managers.camera.autoFocus();
  } catch (focusError) {
    await plugin.managers.camera.reset();
  }
}