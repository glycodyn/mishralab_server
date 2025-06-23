import React, { useEffect, useRef } from 'react';
import './DockingViewer.css';

const DockingViewer = () => {
  const stageRef = useRef(null);
  const boxCompRef = useRef(null);
  const ligandCompRef = useRef(null);

  useEffect(() => {
    let stage;
    let clickedX, clickedY, clickedZ;
    
    function resetStage() {
      const viewport = document.getElementById("viewport");
      viewport.innerHTML = ""; // wipe canvas
    
      const newStage = new window.NGL.Stage("viewport");
      stageRef.current = newStage;
      return newStage;
    }
    

    const init = async () => {
      const NGL = window.NGL;
      stage = new NGL.Stage("viewport");
      stageRef.current = stage;

      document.getElementById("removeCubeBtn").addEventListener("click", () => {
        if (boxCompRef.current) {
          stage.removeComponent(boxCompRef.current);
          boxCompRef.current = null;
        }
      });

      const cxInput = document.getElementById("centerX");
      const cyInput = document.getElementById("centerY");
      const czInput = document.getElementById("centerZ");

      window.addSolidBox = () => {
        const cx = parseFloat(cxInput.value);
        const cy = parseFloat(cyInput.value);
        const cz = parseFloat(czInput.value);
        const sx = parseFloat(document.getElementById("sizeX").value);
        const sy = parseFloat(document.getElementById("sizeY").value);
        const sz = parseFloat(document.getElementById("sizeZ").value);

        if ([cx, cy, cz, sx, sy, sz].some(isNaN)) {
          alert("Click an atom first and/or fill in all numbers");
          return;
        }

        if (boxCompRef.current) stage.removeComponent(boxCompRef.current);

        const shape = new NGL.Shape("cube");
        shape.addBox([cx, cy, cz], [1, 0, 1], sx, [0, sy, 0], [0, 0, sz]);
        const comp = stage.addComponentFromObject(shape);
        comp.addRepresentation("surface", {
          color: 0xffff00,
          opacity: 0.4,
          transparent: true,
          side: "double"
        });
        stage.viewerControls.center(new NGL.Vector3(cx, cy, cz));
        boxCompRef.current = comp;
      };

      window.loadLigand = async () => {
        const f = document.getElementById("ligandFile").files[0];
        if (!f) return alert("Pick a ligand first");
      
        const r = new FileReader();
        r.onload = async () => {
          const text = r.result;
          localStorage.setItem("cachedLigand", text);
          const blob = new Blob([text], { type: "text/plain" });
      
          // 🚨 hard reset
          const stage = resetStage();
      
          stage.loadFile(blob, { ext: "pdbqt" }).then((c) => {
            c.addRepresentation("ball+stick", { colorScheme: "element" });
            stage.autoView();
            stage.viewer.requestRender();
            ligandCompRef.current = c;
          });
        };
      
        r.readAsText(f);
        console.log("Ligand loaded (after full stage reset)");
      };
      
      

      window.loadProtein = () => {
        const f = document.getElementById("proteinFile").files[0];
        if (!f) return alert("Select a protein file.");
        const ext = f.name.split('.').pop();

        stage.removeAllComponents();
        boxCompRef.current = null;

        const reader = new FileReader();
        reader.onload = e => {
          const blob = new Blob([e.target.result], { type: 'text/plain' });
          stage.loadFile(blob, { ext }).then(c => {
            c.addRepresentation("ball+stick", { color: "blue", pickable: true });
            stage.autoView();
            stage.handleResize();
          });
        };
        reader.readAsText(f);
        console.log("Protein Loaded")
      };

      stage.signals.clicked.add(p => {
        if (!p || !p.atom) return;
        cxInput.value = p.atom.x.toFixed(2);
        cyInput.value = p.atom.y.toFixed(2);
        czInput.value = p.atom.z.toFixed(2);
        clickedX = p.atom.x;
        clickedY = p.atom.y;
        clickedZ = p.atom.z;
      });

      document.getElementById("repSelect").addEventListener("change", function () {
        const rep = this.value;
        stage.eachComponent(comp => {
          comp.removeAllRepresentations();
          const opts = rep === "surface" ? { opacity: 0.6, transparent: true } : {};
          comp.addRepresentation(rep, opts);
        });
        stage.autoView();
      });

      document.getElementById("bgSelect").addEventListener("change", function () {
        stage.setParameters({ backgroundColor: this.value });
      });

      window.resetViewer = () => {
        stage.removeAllComponents();
        boxCompRef.current = null;
        stage.handleResize();
      };

      stage.setParameters({ pickable: true });
      stage.handleResize();

      const cached = localStorage.getItem("cachedLigand");
      if (cached) {
        const blob = new Blob([cached], { type: 'text/plain' });

        stage.loadFile(blob, { ext: 'pdbqt' }).then(c => {
          c.addRepresentation("ball+stick", { colorScheme: "element" });
          stage.autoView();
          ligandCompRef.current = c;
        });
      }


      window.addEventListener("resize", () => stage.handleResize());
    };

    const script = document.createElement("script");
    script.src = "https://unpkg.com/ngl@latest/dist/ngl.js";
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  const handleAddBox = () => {
    if (!stageRef.current) return;
    const cx = parseFloat(document.getElementById("centerX").value);
    const cy = parseFloat(document.getElementById("centerY").value);
    const cz = parseFloat(document.getElementById("centerZ").value);
    const shape = new window.NGL.Shape('box');
    shape.addBox([cx, cy, cz], [0, 0, 1], 5, [5, 0, 0], [0, 5, 0]);
    const comp = stageRef.current.addComponentFromObject(shape);
    comp.addRepresentation('surface');
    boxCompRef.current = comp;
  };

  return (
    <div>
      <div className="section">
        <h2>1 – Submit Ligand</h2>
        <label htmlFor="ligandFile">Ligand (PDBQT/MOL2):</label>
        <input type="file" id="ligandFile" accept=".pdbqt,.mol2" />
        <button onClick={() => window.loadLigand()}>Load Ligand</button>

        <h2>2 – Submit Protein</h2>
        <label htmlFor="proteinFile">Protein (PDB/PDBQT):</label>
        <input type="file" id="proteinFile" accept=".pdb,.pdbqt" />
        <button onClick={() => window.loadProtein()}>Load Protein</button>

        <h3>3 – Define search space</h3>
        <label>Search box center&nbsp;
          <input id="centerX" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} />
          <input id="centerY" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} />
          <input id="centerZ" type="number" step="0.1" defaultValue="0" style={{ width: '60px' }} /> Å
        </label><br />

        <label>Search box size&nbsp;
          <input id="sizeX" type="number" defaultValue="5" style={{ width: '60px' }} />
          <input id="sizeY" type="number" defaultValue="5" style={{ width: '60px' }} />
          <input id="sizeZ" type="number" defaultValue="5" style={{ width: '60px' }} /> Å
          <button id="removeCubeBtn">Remove Cube</button>
        </label>

        <button className="reset" onClick={() => window.resetViewer()}>Reset Viewer</button>
        <p>Click any atom to draw a yellow box around it.</p>

        <div className="viewer-container">
          <div className="viewer-wrapper">
            <div id="viewport"></div>
            <div id="bg-toggle">
              <select id="bgSelect">
                <option value="#000000">Dark</option>
                <option value="#ffffff">Light</option>
              </select>
            </div>
            <div id="rep-toggle" style={{ position: 'absolute', top: '50px', right: '10px', zIndex: 200 }}>
              <select id="repSelect" style={{ padding: '4px', fontSize: '14px' }}>
                <option value="cartoon">Cartoon</option>
                <option value="ball+stick">Ball + Stick</option>
                <option value="surface">Surface</option>
                <option value="Line">Lines</option>
              </select>
            </div>
          </div>
          <div className="sidebar-buttons">
            <button>AutoDock Vina</button>
            <button>Vina - Carb</button>
            <button>Glytorch Vina</button>
            <button onClick={handleAddBox}>Add Transparent Box</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DockingViewer;
