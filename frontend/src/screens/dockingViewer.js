//import React, { useState, useEffect, useRef } from 'react';
//import '../styles/dockingViewer.css';
//
//const DockingViewer = () => {
//  const stageRef = useRef(null);
//  const boxCompRef = useRef(null);
//  const ligandCompRef = useRef(null);
//
//  useEffect(() => {
//    let stage;
//    let clickedX, clickedY, clickedZ;
//    
//    function resetStage() {
//      const viewport = document.getElementById("viewport");
//      viewport.innerHTML = ""; // wipe canvas
//    
//      const newStage = new window.NGL.Stage("viewport");
//      stageRef.current = newStage;
//      return newStage;
//    }
//    
//
//    const init = async () => {
//      const NGL = window.NGL;
//      stage = new NGL.Stage("viewport");
//      stageRef.current = stage;
//
//      document.getElementById("removeCubeBtn").addEventListener("click", () => {
//        if (boxCompRef.current) {
//          stage.removeComponent(boxCompRef.current);
//          boxCompRef.current = null;
//        }
//      });
//
//      const cxInput = document.getElementById("centerX");
//      const cyInput = document.getElementById("centerY");
//      const czInput = document.getElementById("centerZ");
//
//      window.addSolidBox = () => {
//        const cx = parseFloat(cxInput.value);
//        const cy = parseFloat(cyInput.value);
//        const cz = parseFloat(czInput.value);
//        const sx = parseFloat(document.getElementById("sizeX").value);
//        const sy = parseFloat(document.getElementById("sizeY").value);
//        const sz = parseFloat(document.getElementById("sizeZ").value);
//
//        if ([cx, cy, cz, sx, sy, sz].some(isNaN)) {
//          alert("Click an atom first and/or fill in all numbers");
//          return;
//        }
//
//        if (boxCompRef.current) stage.removeComponent(boxCompRef.current);
//
//        const shape = new NGL.Shape("cube");
//        shape.addBox([cx, cy, cz], [1, 0, 1], sx, [0, sy, 0], [0, 0, sz]);
//        const comp = stage.addComponentFromObject(shape);
//        comp.addRepresentation("surface", {
//          color: 0xffff00,
//          opacity: 0.4,
//          transparent: true,
//          side: "double"
//        });
//        stage.viewerControls.center(new NGL.Vector3(cx, cy, cz));
//        boxCompRef.current = comp;
//      };
//
//      window.loadLigand = async () => {
//        const f = document.getElementById("ligandFile").files[0];
//        if (!f) return alert("Pick a ligand first");
//      const r = new FileReader();
//        r.onload = async () => {
//          const text = r.result;
//          localStorage.setItem("cachedLigand", text);
//          const blob = new Blob([text], { type: "text/plain" });
//      
//          // 🚨 hard reset
//          const stage = resetStage();
//      
//          stage.loadFile(blob, { ext: "pdbqt" }).then((c) => {
//            c.addRepresentation("ball+stick", { colorScheme: "element" });
//            stage.autoView();
//            stage.viewer.requestRender();
//            ligandCompRef.current = c;
//          });
//        };
//      
//        r.readAsText(f);
//        console.log("Ligand loaded (after full stage reset)");
//      };
//      
//      
//
//      window.loadProtein = () => {
//        const f = document.getElementById("proteinFile").files[0];
//        if (!f) return alert("Select a protein file.");
//        const ext = f.name.split('.').pop();
//
//        stage.removeAllComponents();
//        boxCompRef.current = null;
//
//        const reader = new FileReader();
//        reader.onload = e => {
//          const blob = new Blob([e.target.result], { type: 'text/plain' });
//          stage.loadFile(blob, { ext }).then(c => {
//            c.addRepresentation("ball+stick", { color: "blue", pickable: true });
//            stage.autoView();
//            stage.handleResize();
//          });
//        };
//        reader.readAsText(f);
//        console.log("Protein Loaded")
//      };
//
//      stage.signals.clicked.add(p => {
//        if (!p || !p.atom) return;
//        cxInput.value = p.atom.x.toFixed(2);
//        cyInput.value = p.atom.y.toFixed(2);
//        czInput.value = p.atom.z.toFixed(2);
//        clickedX = p.atom.x;
//        clickedY = p.atom.y;
//        clickedZ = p.atom.z;
//      });
//
//      document.getElementById("repSelect").addEventListener("change", function () {
//        const rep = this.value;
//        stage.eachComponent(comp => {
//          comp.removeAllRepresentations();
//          const opts = rep === "surface" ? { opacity: 0.6, transparent: true } : {};
//          comp.addRepresentation(rep, opts);
//        });
//        stage.autoView();
//      });
//
//      document.getElementById("bgSelect").addEventListener("change", function () {
//        stage.setParameters({ backgroundColor: this.value });
//      });
//
//      window.resetViewer = () => {
//        stage.removeAllComponents();
//        boxCompRef.current = null;
//        stage.handleResize();
//      };
//
//      stage.setParameters({ pickable: true });
//      stage.handleResize();
//
//      const cached = localStorage.getItem("cachedLigand");
//      if (cached) {
//        const blob = new Blob([cached], { type: 'text/plain' });
//
//        stage.loadFile(blob, { ext: 'pdbqt' }).then(c => {
//          c.addRepresentation("ball+stick", { colorScheme: "element" });
//          stage.autoView();
//          ligandCompRef.current = c;
//        });
//      }
//
//
//      window.addEventListener("resize", () => stage.handleResize());
//    };
//
//    const script = document.createElement("script");
//    script.src = "https://unpkg.com/ngl@latest/dist/ngl.js";
//    script.onload = init;
//    document.body.appendChild(script);
//  }, []);
//
//  const handleAddBox = () => {
//    if (!stageRef.current) return;
//    const cx = parseFloat(document.getElementById("centerX").value);
//    const cy = parseFloat(document.getElementById("centerY").value);
//    const cz = parseFloat(document.getElementById("centerZ").value);
//    const shape = new window.NGL.Shape('box');
//    shape.addBox([cx, cy, cz], [0, 0, 1], 5, [5, 0, 0], [0, 5, 0]);
//    const comp = stageRef.current.addComponentFromObject(shape);
//    comp.addRepresentation('surface');
//    boxCompRef.current = comp;
//  };
//
//  return (
//    <div>
//      <div className="section">
//        <h2>1 – Submit Ligand</h2>
//        <label htmlFor="ligandFile">Ligand (PDBQT/MOL2):</label>
//        <input type="file" id="ligandFile" accept=".pdbqt,.mol2" />
//        <button onClick={() => window.loadLigand()}>Load Ligand</button>
//
//        <h2>2 – Submit Protein</h2>
//        <label htmlFor="proteinFile">Protein (PDB/PDBQT):</label>
//        <input type="file" id="proteinFile" accept=".pdb,.pdbqt" />
//        <button onClick={() => window.loadProtein()}>Load Protein</button>
//
//        <h3>3 – Define search space</h3>
//        <label>Search box center&nbsp;
//          <input id="centerX" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} />
//          <input id="centerY" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} />
//          <input id="centerZ" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} /> Å
//        </label><br />
//
//        <label>Search box size&nbsp;
//          <input id="sizeX" type="number" defaultValue="5" style={{ width: '60px' }} />
//          <input id="sizeY" type="number" defaultValue="5" style={{ width: '60px' }} />
//          <input id="sizeZ" type="number" defaultValue="5" style={{ width: '60px' }} /> Å
//          <button id="removeCubeBtn">Remove Cube</button>
//        </label>
//
//        <button className="reset" onClick={() => window.resetViewer()}>Reset Viewer</button>
//        <p>Click any atom to draw a yellow box around it.</p>
//
//        <div className="viewer-container">
//          <div className="viewer-wrapper">
//            <div id="viewport"></div>
//            <div id="bg-toggle">
//              <select id="bgSelect">
//                <option value="#000000">Dark</option>
//                <option value="#ffffff">Light</option>
//              </select>
//            </div>
//            <div id="rep-toggle" style={{ position: 'absolute', top: '50px', right: '10px', zIndex: 200 }}>
//              <select id="repSelect" style={{ padding: '4px', fontSize: '14px' }}>
//                <option value="cartoon">Cartoon</option>
//                <option value="ball+stick">Ball + Stick</option>
//                <option value="surface">Surface</option>
//                <option value="Line">Lines</option>
//              </select>
//            </div>
//          </div>
//          <div className="sidebar-buttons">
//            <button>AutoDock Vina</button>
//            <button>Vina - Carb</button>
//            <button>Glytorch Vina</button>
//            <button onClick={handleAddBox}>Add Transparent Box</button>
//          </div>
//        </div>
//      </div>
//    </div>
//  );
//};
//
//export default DockingViewer;





import React, { useRef, useState, useEffect } from 'react';
import '../styles/dockingViewer.css';
import { initDockingViewer, loadDockingStructure, drawBoundingBox } from '../utils/dockingUtils.js';
import { Structure, StructureElement, StructureProperties } from 'molstar/lib/mol-model/structure';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';


function DockingViewer() {
  const viewerRef = useRef(null);
  const pluginRef = useRef(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [center, setCenter] = useState({ x: 0, y: 0, z: 0 });
  const [boxSize, setBoxSize] = useState({ x: 5, y: 5, z: 5 });
  const [dockingResults, setDockingResults] = useState(null);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [selectedResidues, setSelectedResidues] = useState([]);

  // Track uploaded files
  const [proteinFile, setProteinFile] = useState(null);
  const [ligandFile, setLigandFile] = useState(null);

  // Initialize Mol* viewer once
  React.useEffect(() => {
    let disposed = false;
    (async () => {
      if (viewerRef.current && !pluginRef.current) {
        pluginRef.current = await initDockingViewer(viewerRef.current);
        setPluginsLoaded(true);
      }
    })();
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!pluginsLoaded || !pluginRef.current) return;

    const sub = pluginRef.current.behaviors.interaction.click.subscribe(event => {
      console.log('Mol* click event:', event);

      const selections = Array.from(pluginRef.current.managers.structure.selection.entries.values());
      console.log('Selections:', selections);

      for (const { structure } of selections) {
        if (!structure) continue;
        console.log('Selected structure:', structure);

        Structure.eachAtomicHierarchyElement(structure, {
          residue: (loc) => {
            console.log('Residue location:', loc);

            // Get all atom indices in this residue
            const unit = loc.unit;
            console.log('Unit:', unit);

            const residueIndices = unit.model.atomicHierarchy.residueAtomSegments.index;
            const residueIdx = residueIndices[loc.element];
            console.log('Residue index:', residueIdx);

            // Compute centroid using only unit element indices
            let sum = [0, 0, 0];
            let count = 0;
            const pos = Vec3()
            for (let i = 0; i < unit.elements.length; i++) {
              const eIdx = unit.elements[i];
              if (residueIndices[eIdx] === residueIdx) {
                unit.conformation.position(eIdx, pos); // i is the index into unit.elements
                console.log(`Atom idx: ${eIdx} (unitElementIdx: ${i}), position:`, pos);
                sum[0] += pos[0];
                sum[1] += pos[1];
                sum[2] += pos[2];
                count++;
              }
            }
            if (count > 0) {
              const centroid = sum.map(v => +(v / count).toFixed(2));
          setCenter({ x: centroid[0], y: centroid[1], z: centroid[2] });
          console.log(`Residue centroid at (${centroid[0]}, ${centroid[1]}, ${centroid[2]})`);

          drawBoundingBox(pluginRef.current, {
            x: centroid[0],
            y: centroid[1],
            z: centroid[2]
          });
        } else {
          console.warn('No atoms found for residue!');
        }
          }
        });
      }
    });

    return () => { sub.unsubscribe(); };
  }, [pluginsLoaded]);


  // Load protein structure
  const handleProteinUpload = async (e) => {
    const file = e.target.files[0];
    setProteinFile(file);
    if (file && pluginRef.current) {
      setIsLoading(true);
      setError('');
      try {
        const url = URL.createObjectURL(file);
        await loadDockingStructure(pluginRef.current, url, { format: 'pdb' });
        pluginRef.current.managers.interactivity.setProps({ mode: 'select' });
        setSuccessMessage(`Protein ${file.name} loaded`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to load protein');
      }
      setIsLoading(false);
    }
  };

  // Load ligand structure (as a second structure)
  const handleLigandUpload = async (e) => {
    const file = e.target.files[0];
    setLigandFile(file);
    if (file && pluginRef.current) {
      setIsLoading(true);
      setError('');
      try {
        const url = URL.createObjectURL(file);
        await loadDockingStructure(pluginRef.current, url, { format: 'pdbqt' });
        setSuccessMessage(`Ligand ${file.name} loaded`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to load ligand');
      }
      setIsLoading(false);
    }
  };

  // Add search box using Mol* shape util
  

  // Docking logic unchanged
  const runDocking = async (method) => {
    try {
      setIsLoading(true);
      setError('');
      if (!ligandFile || !proteinFile) {
        setError("Please upload both ligand and protein files");
        return;
      }
      const { x, y, z } = center;
      const { x: sx, y: sy, z: sz } = boxSize;
      if ([x, y, z, sx, sy, sz].some(isNaN)) {
        setError("Please define a valid search box with numeric values");
        return;
      }
      const formData = new FormData();
      formData.append('ligand', ligandFile);
      formData.append('protein', proteinFile);
      formData.append('centerX', x);
      formData.append('centerY', y);
      formData.append('centerZ', z);
      formData.append('sizeX', sx);
      formData.append('sizeY', sy);
      formData.append('sizeZ', sz);
      formData.append('method', method);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/docking/dock`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Docking failed');
      }
      const result = await response.json();
      setDockingResults(result);
    } catch (err) {
      setError(`Error running docking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="docking-viewer-container">
        <h2>AutoDock Vina Molecular Docking</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        <div className="section">
            <h3>1 – Submit Ligand</h3>
            <div className="input-group">
                <label htmlFor="ligandFile">Ligand (PDBQT/MOL2):</label>
                <input
                    type="file"
                    id="ligandFile"
                    accept=".pdbqt,.mol2"
                    onChange={handleLigandUpload}
                />
            </div>
            <h3>2 – Submit Protein</h3>
            <div className="input-group">
                <label htmlFor="proteinFile">Protein (PDB/PDBQT):</label>
                <input
                    type="file"
                    id="proteinFile"
                    accept=".pdb,.pdbqt"
                    onChange={handleProteinUpload}
                />
            </div>
            <h3>3 – Define Search Space</h3>
            <div className="input-group">
                <label>Search box center (Å)</label>
                <div className="coordinate-inputs">
                    <input
                        id="centerX"
                        type="number"
                        step="0.1"
                        value={center.x}
                        style={{ width: '60px' }}
                        onChange={e => setCenter({ ...center, x: parseFloat(e.target.value) })}
                    />
                    <input
                        id="centerY"
                        type="number"
                        step="0.1"
                        value={center.y}
                        style={{ width: '60px' }}
                        onChange={e => setCenter({ ...center, y: parseFloat(e.target.value) })}
                    />
                    <input
                        id="centerZ"
                        type="number"
                        step="0.1"
                        value={center.z}
                        style={{ width: '60px' }}
                        onChange={e => setCenter({ ...center, z: parseFloat(e.target.value) })}
                    />
                    <span>Å</span>
                </div>
            </div>
            <div className="input-group">
                <label>Search box size (Å)</label>
                <div className="coordinate-inputs">
                    <input
                        id="sizeX"
                        type="number"
                        value={boxSize.x}
                        style={{ width: '60px' }}
                        onChange={e => setBoxSize({ ...boxSize, x: parseFloat(e.target.value) })}
                    />
                    <input
                        id="sizeY"
                        type="number"
                        value={boxSize.y}
                        style={{ width: '60px' }}
                        onChange={e => setBoxSize({ ...boxSize, y: parseFloat(e.target.value) })}
                    />
                    <input
                        id="sizeZ"
                        type="number"
                        value={boxSize.z}
                        style={{ width: '60px' }}
                        onChange={e => setBoxSize({ ...boxSize, z: parseFloat(e.target.value) })}
                    />
                    <span>Å</span>
                </div>
            </div>
            <div className="button-group">
                 {/* <button onClick={handleAddBox}>Add Search Box</button> */}
                <button className="reset" onClick={() => {
                    if (pluginRef.current) {
                        pluginRef.current.clear();
                        setSuccessMessage('Viewer reset');
                        setTimeout(() => setSuccessMessage(''), 2000);
                    }
                }}>Reset Viewer</button>
            </div>
            <p className="helper-text">Click any atom to set box center coordinates (Mol* picking can be added)</p>
            {dockingResults && (
                <div style={{ marginTop: '1rem', background: '#eef', padding: '1rem', borderRadius: '7px' }}>
                    <p><strong>Docking Results:</strong></p>
                    <p><strong>Job ID:</strong> {dockingResults.outputId}</p>
                    <p><strong>Status:</strong> {dockingResults.success ? 'Completed' : 'Failed'}</p>
                    {dockingResults.success && (
                        <button onClick={() => window.open(`${process.env.REACT_APP_API_URL}/api/docking/results/${dockingResults.outputId}`, '_blank')} style={{ marginTop: '1rem' }}>
                            Download Results
                        </button>
                    )}
                </div>
            )}
            <div className="viewer-container">
                <div className="viewer-wrapper">
                    <div
                        id="molstar-viewer"
                        ref={viewerRef}
                        style={{
                            width: '100%',
                            height: '600px',
                            background: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: 8,
                            margin: '0 auto',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    />
                </div>
                <div className="sidebar-buttons">
                    <h3>Run Docking</h3>
                    <button
                        onClick={() => runDocking('vina')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Running...' : 'AutoDock Vina'}
                    </button>
                    <button
                        onClick={() => runDocking('vina-carb')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Running...' : 'Vina - Carb'}
                    </button>
                    <button
                        onClick={() => runDocking('glytorch')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Running...' : 'Glytorch Vina'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);
}

export default DockingViewer;