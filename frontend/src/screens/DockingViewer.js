import React, { useEffect, useRef, useState } from 'react';
import { Stage, Shape } from 'ngl';
import '../styles/DockingViewer.css';
import { useNavigate } from 'react-router-dom';


export default function NGLViewer() {
  const stageRef = useRef();
  const viewerDiv = useRef();
  const shapeRef = useRef();
  const atomCenterRef = useRef({ x: 0, y: 0, z: 0 });
  const pdbBlobRef = useRef(null);
  

  const [boxCenter, setBoxCenter] = useState({ x: 0, y: 0, z: 0 });
  const [boxSize, setBoxSize] = useState({ x: 5, y: 5, z: 5 });
  const [exhaustiveness, setExhaustiveness] = useState(8);
  const [numModes, setNumModes] = useState(9);
  const [energyRange, setEnergyRange] = useState(3);
  const [chiCoeff, setChiCoeff] = useState(1);
  const [chiCutoff, setChiCutoff] = useState(0);

  
  useEffect(() => {
    if (pdbLoaded) {
      addBox();
    }
  }, [boxSize]);

  const [hoverCoords, setHoverCoords] = useState('');
  const [pdbReady, setPdbReady] = useState(false);
  const [pdbLoaded, setPdbLoaded] = useState(false);
  const [uploadedReceptor, setUploadedReceptor] = useState(null);
  const [uploadedLigand, setUploadedLigand] = useState(null);
  const [receptorServerPath, setReceptorServerPath] = useState("");
  const [ligandServerPath, setLigandServerPath] = useState("");

  useEffect(() => {
    if (!stageRef.current && viewerDiv.current) {
      stageRef.current = new Stage(viewerDiv.current, {
        backgroundColor: 'white',
      });

      stageRef.current.mouseControls.add('hoverPick', (stage, pickingProxy) => {
        if (pickingProxy && pickingProxy.atom) {
          const atom = pickingProxy.atom;
          const x = atom.x.toFixed(2);
          const y = atom.y.toFixed(2);
          const z = atom.z.toFixed(2);
          const name = atom.qualifiedName(); // Format: [RESIDUE:CHAIN.ATOM]
          const chain = atom.chainname;
          const resname = atom.resname;
          const resno = atom.resno;
          const element = atom.element;
          const coordStr = `(${x}, ${y}, ${z})`;

          const infoStr = `${name} | Chain: ${chain} | Residue: ${resname}${resno} | Element: ${element} | Pos: ${coordStr}`;
          console.log("Hovered Atom Info:", infoStr);
          setHoverCoords(infoStr);

        }
      });

      stageRef.current.signals.clicked.add((pickingProxy) => {
        if (pickingProxy && pickingProxy.atom) {
          const { x, y, z } = pickingProxy.atom;
          const center = { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) };
          atomCenterRef.current = center;
          setBoxCenter(center);
          console.log('Updated Global Atom Center:', atomCenterRef.current);
          setPdbLoaded(true);
        }
      });
    }
  }, []);

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:5000/vina/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    console.log(`📤 ${type} uploaded to:`, data.serverPath);

    if (type === "receptor") {
      setUploadedReceptor(file);
      setReceptorServerPath(data.serverPath);
      const blob = new Blob([file], { type: 'text/plain' });
      pdbBlobRef.current = blob;
      setUploadedReceptor(file);
      setPdbReady(true); 
    } else if (type === "ligand") {
      setUploadedLigand(file);
      setLigandServerPath(data.serverPath);
    }
  };

  const loadPDBToViewer = async () => {
    if (pdbBlobRef.current && stageRef.current) {
      const objectURL = URL.createObjectURL(pdbBlobRef.current);
      stageRef.current.removeAllComponents();

      const comp = await stageRef.current.loadFile(objectURL, { ext: 'pdb' });
      console.log("Component:", comp.structure);

      comp.addRepresentation('cartoon', {
        sele: 'all',
        colorScheme: 'chainname',
      });

      comp.addRepresentation('ball+stick', {
        sele: 'hetero and not water and not ion',
        colorScheme: 'element',
      });

      comp.addRepresentation('surface', {
        sele: 'hetero and not water and not ion',
        opacity: 0.3,
        colorValue: 'white',
        side: 'front',
      });

      comp.autoView();
    }
  };

  const addBox = () => {
    const center = atomCenterRef.current;
    const { x: sx, y: sy, z: sz } = boxSize;
    const stage = stageRef.current;
    const shape = new Shape('box');

    if (shapeRef.current) {
      stage.removeComponent(shapeRef.current);
      shapeRef.current = null;
    }

    shape.addBox(
      [center.x, center.y, center.z],
      [0, 0, 1],
      sx,
      [0, sy, 0],
      [0, 0, sz]
    );

    const comp = stage.addComponentFromObject(shape);
    comp.addRepresentation('buffer', { opacity: 0.4, transparent: true });
    shapeRef.current = comp;
  };

  const generateConfigFile = async () => {
    const receptorFileName = receptorServerPath.split('\\').pop();
    const ligandFileName = ligandServerPath.split('\\').pop();

    const configText = `
receptor = ${receptorFileName}
ligand = ${ligandFileName}

center_x = ${boxCenter.x}
center_y = ${boxCenter.y}
center_z = ${boxCenter.z}

size_x = ${boxSize.x}
size_y = ${boxSize.y}
size_z = ${boxSize.z}

exhaustiveness = ${exhaustiveness}
num_modes = ${numModes}
energy_range = ${energyRange}
    `.trim();

    const configBlob = new Blob([configText], { type: "text/plain" });
    const configFile = new File([configBlob], "config.txt");

    const formData = new FormData();
    formData.append("file", configFile);

    const response = await fetch("http://localhost:5000/vina/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!result.success) throw new Error("Failed to upload config file.");

    return { serverPath: result.serverPath, file: configFile };
  };

  const navigate = useNavigate();

  const runDocking = async () => {
    if (!uploadedReceptor || !uploadedLigand) {
      alert("❗ Please upload both receptor and ligand files before running docking.");
      return;
    }

    navigate("/run-docking", { state: { loading: true } });

    try {
      const { serverPath: configPath, file: configFile } = await generateConfigFile();

      const formData = new FormData();
      formData.append("receptor", uploadedReceptor);
      formData.append("ligand", uploadedLigand);
      formData.append("config", configFile);

      console.log("🧬 FormData Preview:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch("http://localhost:5000/vina/upload-dock", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      navigate("/run-docking", {
        state: {
          loading: false,
          log: result.success ? result.details : "❌ " + result.message,
          scoreTable: result.scoreTable || "No scores returned.",
          outputPath: result.outputPath,
          ligandPath: ligandServerPath,
          receptorPath: receptorServerPath,
          isPureVina: true,
        },
      });
    } catch (err) {
      navigate("/run-docking", {
        state: {
          loading: false,
          log: "❌ Request failed: " + err.message,
          scoreTable: "",
          isPureVina: true,
        },
      });
    }
  };
  const runGlycoTorchDocking = async () => {
    if (!uploadedReceptor || !uploadedLigand) {
      alert("❗ Please upload both receptor and ligand files before running GlycoTorch docking.");
      return;
    }
  
    navigate("/run-docking", { state: { loading: true, isGlycoTorch: true} });
  
    try {
      const { serverPath: configPath, file: configFile } = await generateConfigFile();
  
      const response = await fetch("http://localhost:5000/vina/dock-glyco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receptorPath: receptorServerPath,
          ligandPath: ligandServerPath,
          configPath,
          chiCoeff,
          chiCutoff
        }),
      });
  
      const result = await response.json();
  
      navigate("/run-docking", {
        state: {
          loading: false,
          log: result.success ? result.details : "❌ " + result.message,
          scoreTable: result.scoreTable || "No scores returned.",
          outputPath: result.outputPath,
          ligandPath: ligandServerPath,
          receptorPath: receptorServerPath,
          isGlycoTorch: true,
        },
      });
    } catch (err) {
      navigate("/run-docking", {
        state: {
          loading: false,
          log: "❌ GlycoTorch request failed: " + err.message,
          scoreTable: "",
        },
      });
    }
  };
  
  const runVinaCarbDocking = async () => {
    if (!uploadedReceptor || !uploadedLigand) {
      alert("❗ Please upload both receptor and ligand files before running Vina-Carb.");
      return;
    }
  
    navigate("/run-docking", { state: { loading: true, isVinaCarb: true } });
  
    try {
      const { serverPath: configPath, file: configFile } = await generateConfigFile();
  
      const response = await fetch("http://localhost:5000/vina/dock-carb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receptorPath: receptorServerPath,
          ligandPath: ligandServerPath,
          configPath
        }),
      });
  
      const result = await response.json();
  
      navigate("/run-docking", {
        state: {
          loading: false,
          log: result.success ? result.output : "❌ " + result.message,
          scoreTable: result.scoreTable || "No scores returned.",
          outputPath: result.outputPath,
          ligandPath: ligandServerPath,
          receptorPath: receptorServerPath,
          isVinaCarb: true,
        },
      });
    } catch (err) {
      navigate("/run-docking", {
        state: {
          loading: false,
          log: "❌ Vina-Carb request failed: " + err.message,
          scoreTable: "",
        },
      });
    }
  };
  
  

  return (
    <div className="container">
      <div className="upload-fields">
        <label>Upload Receptor (.pdbqt):</label>
        <input
          type="file"
          accept=".pdbqt"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setUploadedReceptor(file);
              uploadFile(file, "receptor");
            }
          }}
        />

        <label>Upload Ligand (.pdbqt):</label>
        <input
          type="file"
          accept=".pdbqt"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setUploadedLigand(file);
              uploadFile(file, "ligand");
            }
          }}
        />
      </div>

      <button disabled={!pdbReady} onClick={loadPDBToViewer}>Display Target</button>
      <button disabled={!pdbLoaded} onClick={addBox}>Add a Docking Box</button>

      <div>
        <label>Box Center:</label>
        <input type="number" value={boxCenter.x} onChange={(e) => setBoxCenter({ ...boxCenter, x: +e.target.value })} />
        <input type="number" value={boxCenter.y} onChange={(e) => setBoxCenter({ ...boxCenter, y: +e.target.value })} />
        <input type="number" value={boxCenter.z} onChange={(e) => setBoxCenter({ ...boxCenter, z: +e.target.value })} />
      </div>

      <div>
        <label>Box Size:</label>
        <input type="number" value={boxSize.x} onChange={(e) => setBoxSize({ ...boxSize, x: +e.target.value })} />
        <input type="number" value={boxSize.y} onChange={(e) => setBoxSize({ ...boxSize, y: +e.target.value })} />
        <input type="number" value={boxSize.z} onChange={(e) => setBoxSize({ ...boxSize, z: +e.target.value })} />
      </div>

      <div className="viewer-wrapper">
      <div className="ngl-wrapper">
        <div className="ngl-viewer" ref={viewerDiv}></div>
        <div className="hover-info-box">{hoverCoords}</div>
      </div>


        <div className="button-panel">
          <button onClick={runDocking}>AutoDock Vina</button>
          <button onClick={runVinaCarbDocking}>Vina Carb</button>
          <button onClick={runGlycoTorchDocking}>GlycoTorch Vina</button>

          <div className="vina-params">
          <label>Exhaustiveness:</label>
          <input type="number" value={exhaustiveness} onChange={(e) => setExhaustiveness(+e.target.value)} />
          <label>Num Modes:</label>
          <input type="number" value={numModes} onChange={(e) => setNumModes(+e.target.value)} />
          <label>Energy Range:</label>
          <input type="number" value={energyRange} onChange={(e) => setEnergyRange(+e.target.value)} />
          
          <label>Chi Coeff (Glycotorch only):</label>
          <input type="number" value={chiCoeff} onChange={(e) => setChiCoeff(+e.target.value)} />
          <label>Chi Cutoff (Glycotorch only):</label>
          <input type="number" value={chiCutoff} onChange={(e) => setChiCutoff(+e.target.value)} />
        </div>
        </div>
      </div>
    </div>
  );
}
