import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { ShapeRepresentation } from 'molstar/lib/mol-repr/shape/representation';
import { ShapeGroup } from 'molstar/lib/mol-model/shape';
import { Shape } from 'molstar/lib/mol-model/shape';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { addBoundingBox } from 'molstar/lib/mol-geo/geometry/mesh/builder/box';
import { StateTransform } from 'molstar/lib/mol-state';
import { MeshBuilder } from 'molstar/lib/mol-geo/geometry/mesh/mesh-builder';
import { Mesh } from 'molstar/lib/mol-geo/geometry/mesh/mesh';
import { Color } from 'molstar/lib/mol-util/color';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
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

  const spec = options?.spec || dockingUISpec;
  const plugin = await createPluginUI({
    target: parent,
    spec: spec,
    render: renderReact18
  });

  // ...any docking-specific UI tweaks...

  return plugin;
}

export async function loadDockingStructure(plugin, url, options) {
  await plugin.clear();
  const data = await plugin.builders.data.download({ url, isBinary: options?.isBinary });
  const trajectory = await plugin.builders.structure.parseTrajectory(data, options?.format ?? 'pdb');
  const preset = plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
  await preset;
  await plugin.managers.camera.reset();
  try {
    await plugin.managers.camera.autoFocus();
  } catch (focusError) {
    await plugin.managers.camera.reset();
  }
}

let lastBoxRef = null;
let lastMeshRef = null;

export async function drawBoundingBox(plugin, center, tag = 'docking-box') {
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
  )|| [];
  for (const p of prev) {
    await plugin.state.data.remove(p.transform.ref);
  }

  // Find a parent to attach the shape under
  const parentNode =
    plugin.state.data.select(c =>
      c.transform?.transformer?.id === 'structure-component'
    )[0] ||
    plugin.state.data.select(c =>
      c.transform?.transformer?.id === 'structure'
    )[0] ||
    plugin.state.data.select(c =>
      c.transform?.transformer?.id === 'model'
    )[0];

  const parentRef = parentNode?.transform?.ref || plugin.state.data.root.ref;

  if (!parentRef) {
    console.error('❌ No valid parent node found in state tree.');
    return;
  }

  const shapeRep = plugin.state.data.build()
    .to(parentRef)
    .apply(StateTransforms.Representation.ShapeRepresentation3D, {
      shape,
      alpha: 0.5,
      material: { kind: 'metallic', metalness: 0.1, roughness: 0.8 }
    }, { tags: [tag] });

  await shapeRep.commit();
}