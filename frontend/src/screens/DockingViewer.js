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
          setHoverCoords(`${x}, ${y}, ${z}`);
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

  // const handleUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const blob = new Blob([file], { type: 'text/plain' });
  //     pdbBlobRef.current = blob;
  //     setPdbReady(true);
  //     setUploadedReceptor(file); 
  //   }
  // };
  // const handleLigandUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setUploadedLigand(file);
  //   }
  // };
  
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
      sx,                 // width (X axis)
      [0, sy, 0],         // height (Y axis)
      [0, 0, sz]          // depth (Z axis)
    );;
  
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
      
      exhaustiveness = 8
      num_modes = 9
      energy_range = 3
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
          // 🧠 First, generate the config file and get the path back
          const { serverPath: configPath, file: configFile } = await generateConfigFile();
      
          const formData = new FormData();
          formData.append("receptor", uploadedReceptor);  // already uploaded
          formData.append("ligand", uploadedLigand);      // already uploaded
          formData.append("config", configFile);            // returned by generateConfigFile


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
            },
          });
        } catch (err) {
          navigate("/run-docking", {
            state: {
              loading: false,
              log: "❌ Request failed: " + err.message,
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

      <button disabled={!pdbReady} onClick={loadPDBToViewer}>Load Molecule</button>
      <button disabled={!pdbLoaded} onClick={addBox}>Add a Docking Box</button>
      <button disabled>Display Target</button>

      {/* === Info Section === */}
      <div>
        <label>Hover Coords: </label>
        <span>{hoverCoords}</span>
      </div>
  
      <div>
      <label>Box Center:</label>
      <input
        type="number"
        value={boxCenter.x}
        onChange={(e) => {
          const newVal = { ...boxCenter, x: +e.target.value };
          setBoxCenter(newVal);
          atomCenterRef.current = newVal;
        }}
      />
      <input
        type="number"
        value={boxCenter.y}
        onChange={(e) => {
          const newVal = { ...boxCenter, y: +e.target.value };
          setBoxCenter(newVal);
          atomCenterRef.current = newVal;
        }}
      />
      <input
        type="number"
        value={boxCenter.z}
        onChange={(e) => {
          const newVal = { ...boxCenter, z: +e.target.value };
          setBoxCenter(newVal);
          atomCenterRef.current = newVal;
        }}
      />
    </div>
  
      <div>
        <label>Box Size:</label>
        <input type="number" value={boxSize.x} onChange={(e) => setBoxSize({ ...boxSize, x: +e.target.value })} />
        <input type="number" value={boxSize.y} onChange={(e) => setBoxSize({ ...boxSize, y: +e.target.value })} />
        <input type="number" value={boxSize.z} onChange={(e) => setBoxSize({ ...boxSize, z: +e.target.value })} />
      </div>

      <div className="viewer-wrapper"> 
      <div ref={viewerDiv} className="ngl-viewer"></div>
      <div className="button-panel">
        <button onClick={runDocking}>AutoDock Vina</button>
        <button>Vina Carb</button>
        <button>Glytorch Vina</button>
      </div>
    </div>

    </div>
  );
  
}
