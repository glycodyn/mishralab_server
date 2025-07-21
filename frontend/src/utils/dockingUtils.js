import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { Box3D } from 'molstar/lib/mol-math/geometry';
import { Loci } from 'molstar/lib/mol-model/loci';
import { Shape } from 'molstar/lib/mol-model/shape';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { addBoundingBox } from 'molstar/lib/mol-geo/geometry/mesh/builder/box';
import { StructureElement } from 'molstar/lib/mol-model/structure';
import { MeshBuilder } from 'molstar/lib/mol-geo/geometry/mesh/mesh-builder';

import { Color } from 'molstar/lib/mol-util/color';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

import 'molstar/lib/mol-plugin-ui/skin/light.scss';

const dockingUISpec = {
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
};

export async function initDockingViewer(elementOrId, options) {
  const parent = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!parent) throw new Error('Element not found');
  while (parent.firstChild) parent.removeChild(parent.firstChild);

  //const spec = options?.spec || dockingUISpec;
  const plugin = await createPluginUI({
    target: parent,
    spec: DefaultPluginUISpec(),
    render: renderReact18
  });

  // ...any docking-specific UI tweaks...

  return plugin;
}

async function waitForStructureNode(plugin, structureRef, maxTries = 20, delay = 100) {
  for (let i = 0; i < maxTries; i++) {
    const allNodes = plugin.state.data.select();
    if (allNodes.some(n => n.transform?.ref === structureRef)) {
      return true;
    }
    await new Promise(res => setTimeout(res, delay));
  }
  return false;
}

export async function loadDockingStructure(plugin, url, options) {
  await plugin.clear();
  const data = await plugin.builders.data.download({ url, isBinary: options?.isBinary });
  const trajectory = await plugin.builders.structure.parseTrajectory(data, options?.format ?? 'pdb');
  console.log('Loaded trajectory:', trajectory);
  console.log('Trajectory models:', trajectory?.data?.models);
  console.log('Trajectory data:', trajectory.data);
  let preset;
  try{
  preset = await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
  
  console.log('Applied hierarchy preset:', preset);
  } catch (error) {
    console.error('Error applying hierarchy preset:', error);
    throw error;
  }
  
 logAllStateNodes(plugin);
  await plugin.managers.camera.reset();
  try {
    await plugin.managers.camera.autoFocus();
  } catch (focusError) {
    await plugin.managers.camera.reset();
  }
   const structureRef = preset.structure?.ref;
  console.log('preset', preset);
  //console.log("presets ", preset.structure?.ref, preset.structure?.data?.hashCode);
 await waitForStructureNode(plugin, structureRef);


  return {
    ...preset,
    structureRef: preset.structure?.ref
  };
}

let lastBoxRef = null;
let lastMeshRef = null;


export function logAllStateNodes(plugin) {
    const allNodes = plugin.state.data.select();
    console.log('--- All State Nodes ---');
    allNodes.forEach(n => {
        console.log({
            ref: n.transform?.ref,
            transformer: n.transform?.transformer?.id,
            hashCode: n.obj?.data?.hashCode,
            structureHash: n.obj?.data?.structure?.hashCode
        });
    });
}
export async function drawBoundingBox(plugin, structureRef, center, tag = 'docking-box', lociStructure) {
    

  const size = { x: 10, y: 10, z: 10 };
  const half = {
    x: size.x / 2,
    y: size.y / 2,
    z: size.z / 2,
  };

  const min = Vec3.create(center.x - half.x, center.y - half.y, center.z - half.z);
  const max = Vec3.create(center.x + half.x, center.y + half.y, center.z + half.z);
  const box = { min, max };

  const state = MeshBuilder.createState();
  addBoundingBox(state, box, 0.1, 0, 10);
  const mesh = MeshBuilder.getMesh(state);

  const shape = Shape.create(tag, {}, mesh, () => Color(0xff0000), () => 0.3);

  // Clean up any previous shapes with the same tag
  const prev = plugin.state.data.select(c =>
    c.tags?.includes(tag) &&
    c.transform?.transformer === StateTransforms.Representation.ShapeRepresentation3D
  ) || [];
  for (const p of prev) {
    await plugin.state.data.remove(p.transform.ref);
  }

  // --- NEW: Find the structure node from the loci ---
  let structureNode = null;
  if (lociStructure && lociStructure.hashCode !== undefined) {
    const allNodes = plugin.state.data.select();
    structureNode = allNodes.find(n =>
      n.obj?.data?.hashCode === lociStructure.hashCode ||
      n.obj?.data?.structure?.hashCode === lociStructure.hashCode
    );
  }
  
  

 if (!structureNode && structureRef) {
    structureNode = plugin.state.data.select(n => n.transform?.transformer === StateTransforms.Model.StructureFromModel)[0];
  }

  if (!structureNode) {
    console.error(`Structure node not found for ref: ${structureRef} or loci structure hash.`);
    return;
  }
try{
  const shapeRep = plugin.state.data.build()
    .toRoot(structureNode)
    .apply(StateTransforms.Representation.ShapeRepresentation3D, {
      shape,
      alpha: 0.5,
      material: { kind: 'metallic', metalness: 0.1, roughness: 0.8 }
    }, { tags: [tag] });

  await shapeRep.commit();
} catch (error) {
    console.error('Error creating shape representation:', error);
    
    return;
  }
}