import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/authCOntext';
import { initViewer, loadStructure } from '../utils/boltzViewer';
import {BoltzViewer} from '../screens/Boltz_viewer'
import yaml from 'js-yaml';
import '../styles/boltz.css';
const emptyConstraint = { type: 'bond', atom1: '', atom2: '', binder: '', contacts: '', max_distance: '', token1: '', token2: '' };

const Boltz2 = () => {
    
  const { user } = useAuth();
  const email = user?.email || '';
  const userId = user?._id || '';

  const [inputFile, setInputFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [glycans, setGlycans] = useState([]);
    const [manualAc, setManualAc] = useState({});
  const [manualSmiles, setManualSmiles] = useState({});
  const [manualError, setManualError] = useState({});
  const [glycanImages, setGlycanImages] = useState({});
const [glycanImageErrors, setGlycanImageErrors] = useState({});

  const [sequences, setSequences] = useState([
    { entityType: '', id: '', sequence: '', smiles: '', ccd: '', msa: '', cyclic: false }
  ]);
const [constraints, setConstraints] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (!email) return;
    let isMounted = true;
    const fetchJobs = () => {
      fetch(`${process.env.REACT_APP_API_URL}/boltz/jobs/${email}`)
        .then(res => res.json())
        .then(data => { if (isMounted) setSearchResults(data); })
        .catch(() => { if (isMounted) setSearchResults([]); });
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [email, result]);

  useEffect(() => {
     fetch(`${process.env.REACT_APP_API_URL}/glycan/get`)
    .then(res => res.json())
    .then(data => setGlycans(data))
    .catch(() => setGlycans([]));
  }, []);

    const fetchSmilesByAc = async (ac, idx) => {
  setManualError(prev => ({ ...prev, [idx]: '' }));
  setManualSmiles(prev => ({ ...prev, [idx]: '' }))
    if (!ac) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/glycan/smiles/${ac}`);
      if (!res.ok) {
        const err = await res.json();
        setManualError(prev => ({ ...prev, [idx]: err.error || 'Not found' }))
        return;
      }
      const data = await res.json();
      setManualSmiles(prev => ({ ...prev, [idx]: data.smiles }));
      handleSeqChange(idx, 'smiles', data.smiles);
    } catch (e) {
      setManualError(prev => ({ ...prev, [idx]: 'Error fetching SMILES' }));
    }
  };

 

function toYAML(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return `${pad}- ${toYAML(item, indent + 1).trimStart()}`;
      } else {
        return `${pad}- ${item}`;
      }
    }).join('\n');
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj)
      .filter(([k, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => {
        if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
          return `${pad}${k}:\n${toYAML(v, indent + 1)}`;
        }
        return `${pad}${k}: ${v}`;
      }).join('\n');
  } else {
    return `${pad}${obj}`;
  }
}

  const fetchGlycanImage = async (ac, idx) => {
  if (!ac) return;
  console.log("fetching imafe for: ", ac)
  setGlycanImageErrors(prev => ({ ...prev, [idx]: '' }));
  setGlycanImages(prev => ({ ...prev, [idx]: '' }));
  try {
    // Just set the image URL, let the browser handle loading
    setGlycanImages(prev => ({
      ...prev,
      [idx]: `${process.env.REACT_APP_API_URL}/glycan/image/${ac}`
    }));
  } catch (e) {
    setGlycanImageErrors(prev => ({
      ...prev,
      [idx]: 'Image not available'
    }));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setResult(null);

  let yamlFile = null;

  if (inputFile) {
    yamlFile = inputFile;
  } else {
   
  const yamlSequences = sequences
  .filter(seq => seq.entityType && seq.id) // Only require entityType and id
  .map(seq => {
    const { entityType, ...rest } = seq;
    const clean = Object.fromEntries(
      Object.entries(rest).filter(([k, v]) => 
        v !== '' && 
        v !== undefined && 
        v !== null &&
        !(Array.isArray(v) && v.length === 0) &&
        !(typeof v === 'boolean' && v === false && k !== 'cyclic') // Keep cyclic if explicitly false
      )
    );
    
    // Special handling for ligands - ensure we keep either smiles or ccd
    if (entityType === 'ligand' && !clean.smiles && !clean.ccd) {
      return null; // Skip invalid ligands
    }
    
    return { [entityType]: clean };
  })
  .filter(Boolean);
const yamlTemplates = templates
  .map(t => {
    let entry = {};
    if (t.cif) entry.cif = `/inputs/${t.cif}`;
    if (t.chain_id) {
      entry.chain_id = t.chain_id.includes(',')
        ? t.chain_id.split(',').map(s => s.trim()).filter(Boolean)
        : t.chain_id.trim();
    }
    if (t.template_id) {
      entry.template_id = t.template_id.includes(',')
        ? t.template_id.split(',').map(s => s.trim()).filter(Boolean)
        : t.template_id.trim();
    }
    // Only include if at least one field is present
    return Object.keys(entry).length > 0 ? entry : null;
  })
  .filter(Boolean);

const yamlConstraints = constraints
  .map(c => {
    if (c.type === 'bond' && c.atom1 && c.atom2) {
      return { bond: { atom1: c.atom1.split(',').map(s => s.trim()).filter(Boolean), atom2: c.atom2.split(',').map(s => s.trim()).filter(Boolean) } };
    }
    if (c.type === 'pocket' && c.binder && c.contacts) {
      return { pocket: { binder: c.binder, contacts: c.contacts.split(';').map(s => s.split(',').map(x => x.trim()).filter(Boolean)), max_distance: c.max_distance } };
    }
    if (c.type === 'contact' && c.token1 && c.token2) {
      return { contact: { token1: c.token1.split(',').map(s => s.trim()).filter(Boolean), token2: c.token2.split(',').map(s => s.trim()).filter(Boolean), max_distance: c.max_distance } };
    }
    return null;
  })
  .filter(Boolean);

const yamlProperties = properties
  .map(p => {
    if (p.type === 'affinity' && p.binder) {
      return { affinity: { binder: p.binder } };
    }
    return null;
  })
  .filter(Boolean);

    const yamlObj = {
      version: 1,
      sequences: yamlSequences,
      constraints: yamlConstraints,
      templates: yamlTemplates,
      properties: yamlProperties
    };

    const yamlStr = toYAML(yamlObj);
    const yamlStrWithNewline = yamlStr.endsWith('\n') ? yamlStr : `${yamlStr}\n`;
    const blob = new Blob([yamlStrWithNewline], { type: 'text/yaml' });
    yamlFile = new File([blob], 'input.yaml', { type: 'text/yaml' });
  }

  const formData = new FormData();
  formData.append('file', yamlFile);
  formData.append('email', email);
  formData.append('userId', userId);
  formData.append('jobTitle', jobTitle);

  // --- Attach template files ---
  templates.forEach((t, i) => {
    if (t.file) formData.append(`templateFile${i}`, t.file);
  });

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/boltz/run`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Job submission failed');
    setResult(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  const handleSeqChange = (idx, field, value) => {
    const updated = [...sequences];
    updated[idx][field] = value;
    setSequences(updated);
  };
  const addSequence = () => setSequences([...sequences, { entityType: '', id: '', sequence: '', smiles: '', ccd: '', msa: '', cyclic: false }]);
  const removeSequence = idx => setSequences(sequences.filter((_, i) => i !== idx));

  const handleConstraintChange = (idx, value) => {
    const updated = [...constraints];
    updated[idx] = value;
    setConstraints(updated);
  };

  const handleConstraintField = (idx, field, value) => {
  const updated = [...constraints];
  updated[idx][field] = value;
  setConstraints(updated);
};
const addConstraint = () => setConstraints([...constraints, { ...emptyConstraint }]);
const removeConstraint = idx => setConstraints(constraints.filter((_, i) => i !== idx));

  const handleTemplateChange = (idx, value) => {
    const updated = [...templates];
    updated[idx] = value;
    setTemplates(updated);
  };
  const addTemplate = () => setTemplates([...templates, '']);
  const removeTemplate = idx => setTemplates(templates.filter((_, i) => i !== idx));

  const handlePropertyChange = (idx, value) => {
    const updated = [...properties];
    updated[idx] = value;
    setProperties(updated);
  };
  const addProperty = () => setProperties([...properties, '']);
  const removeProperty = idx => setProperties(properties.filter((_, i) => i !== idx));

  const handleFileChange = (e) => setInputFile(e.target.files[0]);

  const handleDownload = async (jobId) => {
    if (!jobId) return;
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL}/boltz/download/${jobId}`;
    link.setAttribute('download', `${jobId}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="vis-container">
      <h2 style={{ color: '#0000cd' }}>Boltz2 Job Submission</h2>
      <form onSubmit={handleSubmit}>
        <div className="ligandmpnn-form-group">
          <input
            type="text"
            placeholder="Enter job title"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            className="ligandmpnn-input"
          />
        </div>
        <div className="ligandmpnn-form-group">
          <label>
            <strong>YAML or FASTA File (optional):</strong>
            <input
              type="file"
              accept=".yaml,.yml,.fa,.fasta"
              onChange={handleFileChange}
              className="ligandmpnn-input"
              style={{ marginTop: '0.5em' }}
            />
          </label>
        </div>
        <hr />
        <h4>Sequences</h4>
        {sequences.map((seq, idx) => (
          <div key={idx} className="ligandmpnn-form-group" style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 12, background: '#f8f9fa' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                className="ligandmpnn-input"
                style={{ minWidth: 120, flex: 1 }}
                placeholder="Entity Type (protein/dna/rna/ligand)"
                value={seq.entityType}
                onChange={e => handleSeqChange(idx, 'entityType', e.target.value)}
              />
              <input
                className="ligandmpnn-input"
                style={{ minWidth: 80, flex: 1 }}
                placeholder="ID"
                value={seq.id}
                onChange={e => handleSeqChange(idx, 'id', e.target.value)}
              />
              <input
                className="ligandmpnn-input"
                style={{ minWidth: 80, flex: 1 }}
                placeholder="SMILES"
                value={seq.smiles}
                onChange={e => handleSeqChange(idx, 'smiles', e.target.value)}
              />
              <input
                className="ligandmpnn-input"
                style={{ minWidth: 80, flex: 1 }}
                placeholder="CCD"
                value={seq.ccd}
                onChange={e => handleSeqChange(idx, 'ccd', e.target.value)}
              />
              <input
                className="ligandmpnn-input"
                style={{ minWidth: 120, flex: 1 }}
                placeholder="MSA Path"
                value={seq.msa}
                onChange={e => handleSeqChange(idx, 'msa', e.target.value)}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Cyclic:
                <input
                  type="checkbox"
                  checked={seq.cyclic}
                  onChange={e => handleSeqChange(idx, 'cyclic', e.target.checked)}
                  style={{ marginLeft: 4 }}
                />
              </label>
              <Button size="sm" variant="danger" onClick={() => removeSequence(idx)} style={{ marginLeft: 8, height: 38 }}>Remove</Button>
            </div>
            <div style={{ marginTop: 8 }}>
              <textarea
                className="ligandmpnn-input"
                style={{ width: '100%', minHeight: 30 }}
                placeholder="Sequence "
                value={seq.sequence}
                onChange={e => handleSeqChange(idx, 'sequence', e.target.value)}
              />
            </div>
            {seq.entityType==='ligand'&&(
              <>
                 <select
    className="ligandmpnn-input"
    style={{ minWidth: 180, flex: 1 }}
    value=""
    onChange={e => {
      const glycan = glycans.find(g => g.name === e.target.value);
      if (glycan) {
        handleSeqChange(idx, 'smiles', glycan.smiles);
        fetchGlycanImage(glycan.name, idx)
        setManualSmiles('')
      }
    }}
  >
    <option value="">Select glycan...</option>
    {glycans.map(g => (
      <option key={g.name} value={g.name}>
        {g.name}
      </option>
    ))}
  </select>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="ligandmpnn-input"
                    style={{ minWidth: 120 }}
                    placeholder="Enter GlyTouCan AC"
                    value={manualAc[idx] || ''}
                    onChange={e => setManualAc(prev => ({ ...prev, [idx]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        handleSeqChange(idx, "entityType", "ligand")
                         handleSeqChange(idx, 'id', manualAc[idx]); 
                        fetchSmilesByAc(manualAc[idx], idx)
                        fetchGlycanImage(manualAc[idx], idx)
                    }}
                  >
                    Get SMILES
                  </Button>
                </div>
                {glycanImages[idx] && (
      <div style={{ marginTop: 8 }}>
        <img
          src={glycanImages[idx]}
          alt="Glycan structure"
          style={{ maxWidth: 180, maxHeight: 120, border: '1px solid #ccc', background: '#fff' }}
          onError={() => setGlycanImageErrors(prev => ({ ...prev, [idx]: 'Image not available' }))}
        />
        {glycanImageErrors[idx] && (
          <div style={{ color: 'red', fontSize: 12 }}>{glycanImageErrors[idx]}</div>
        )}
      </div>
    )}
                {manualSmiles && (
                  <div style={{ color: 'green', fontSize: 12, marginTop: 4 }}>
                    SMILES: {manualSmiles[idx]}
                  </div>
                )}
                {manualError && (
                  <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
                    {manualError[idx]}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <Button size="sm" onClick={addSequence} style={{ marginBottom: 12 }}>Add Sequence</Button>
        <hr />
        <h4>Constraints</h4>
{constraints.map((c, idx) => (
  <div key={idx} className="ligandmpnn-form-group" style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
       <select
      className="ligandmpnn-input"
      style={{ minWidth: 180, flex: 1, marginBottom: 8 }}
      value={c.type}
      onChange={e => handleConstraintField(idx, 'type', e.target.value)}
    >
      <option value="bond">Bond</option>
      <option value="pocket">Pocket</option>
      <option value="contact">Contact</option>
    </select>
    {c.type === 'bond' && (
      <>
        <input
          className="ligandmpnn-input"
          placeholder="atom1 (e.g. A,1,CA)"
          value={c.atom1}
          onChange={e => handleConstraintField(idx, 'atom1', e.target.value)}
        />
        <input
          className="ligandmpnn-input"
          placeholder="atom2 (e.g. B,2,CB)"
          value={c.atom2}
          onChange={e => handleConstraintField(idx, 'atom2', e.target.value)}
        />
      </>
    )}
    {c.type === 'pocket' && (
      <>
        <input
          className="ligandmpnn-input"
          placeholder="binder (CHAIN_ID)"
          value={c.binder}
          onChange={e => handleConstraintField(idx, 'binder', e.target.value)}
        />
        <input
          className="ligandmpnn-input"
          placeholder="contacts (e.g. A,1,CA;B,2,CB)"
          value={c.contacts}
          onChange={e => handleConstraintField(idx, 'contacts', e.target.value)}
        />
        <input
          className="ligandmpnn-input"
          placeholder="max_distance (Å)"
          value={c.max_distance}
          onChange={e => handleConstraintField(idx, 'max_distance', e.target.value)}
        />
      </>
    )}
    {c.type === 'contact' && (
      <>
        <input
          className="ligandmpnn-input"
          placeholder="token1 (e.g. A,1,CA)"
          value={c.token1}
          onChange={e => handleConstraintField(idx, 'token1', e.target.value)}
        />
        <input
          className="ligandmpnn-input"
          placeholder="token2 (e.g. B,2,CB)"
          value={c.token2}
          onChange={e => handleConstraintField(idx, 'token2', e.target.value)}
        />
        <input
          className="ligandmpnn-input"
          placeholder="max_distance (Å)"
          value={c.max_distance}
          onChange={e => handleConstraintField(idx, 'max_distance', e.target.value)}
        />
      </>
    )}
    <Button
        size="sm"
        variant="danger"
        style={{ marginLeft: 8, height: 28, padding: '0 10px', fontSize: 12 }}
        onClick={() => removeConstraint(idx)}
    >       
        Remove
    </Button>
  </div>
))}
<Button size="sm" onClick={addConstraint} style={{ marginBottom: 12 }}>Add Constraint</Button>
    <h4>Templates</h4>
{templates.map((t, idx) => (
  <div key={idx} className="ligandmpnn-form-group" style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
    <label>
      CIF File:
      <input
        type="file"
        accept=".cif"
        onChange={e => {
          const file = e.target.files[0];
          const updated = [...templates];
          updated[idx] = { ...updated[idx], file, cif: file ? file.name : (t.cif || '') };
          setTemplates(updated);
        }}
        style={{ marginBottom: 8 }}
      />
    </label>
    <input
      className="ligandmpnn-input"
      placeholder="CIF path (if not uploading file)"
      value={t.cif || ''}
      onChange={e => {
        const updated = [...templates];
        updated[idx] = { ...updated[idx], cif: e.target.value };
        setTemplates(updated);
      }}
      style={{ marginBottom: 8 }}
    />
    <input
      className="ligandmpnn-input"
      placeholder="chain_id (optional, comma separated for multiple)"
      value={t.chain_id || ''}
      onChange={e => {
        const updated = [...templates];
        updated[idx] = { ...updated[idx], chain_id: e.target.value };
        setTemplates(updated);
      }}
      style={{ marginBottom: 8 }}
    />
    <input
      className="ligandmpnn-input"
      placeholder="template_id (optional, comma separated for multiple)"
      value={t.template_id || ''}
      onChange={e => {
        const updated = [...templates];
        updated[idx] = { ...updated[idx], template_id: e.target.value };
        setTemplates(updated);
      }}
      style={{ marginBottom: 8 }}
    />
<Button
        size="sm"
        variant="danger"
        style={{ marginLeft: 8, height: 28, padding: '0 10px', fontSize: 12 }}
        onClick={() => removeTemplate(idx)}
    >       
        Remove
    </Button>  </div>
))}
<Button size="sm" onClick={() => setTemplates([...templates, { cif: '', chain_id: '', template_id: '', file: null }])} style={{ marginBottom: 12 }}>Add Template</Button>
        <h4>Properties</h4>
{properties.map((p, idx) => (
  <div key={idx} className="ligandmpnn-form-group" style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
        <select
          className="ligandmpnn-input"
          style={{ minWidth: 180, flex: 1, marginBottom: 8 }}
          value={p.type || 'affinity'}
          onChange={e => {
            const updated = [...properties];
            updated[idx].type = e.target.value;
            setProperties(updated);
          }}
        >
          <option value="affinity">Affinity</option>
          {/*more options here, later */}
        </select>
    {p.type === 'affinity' && (
      <input
        className="ligandmpnn-input"
        placeholder="binder (CHAIN_ID)"
        value={p.binder || ''}
        onChange={e => {
          const updated = [...properties];
          updated[idx].binder = e.target.value;
          setProperties(updated);
        }}
      />
    )}
        <Button
      size="sm"
      variant="danger"
      style={{ marginLeft: 8, height: 28, padding: '0 10px', fontSize: 12 }}
      onClick={() => removeProperty(idx)}
    >
      Remove
    </Button>
  </div>
))}
<Button size="sm" onClick={() => setProperties([...properties, { type: 'affinity', binder: '' }])} style={{ marginBottom: 12 }}>Add Property</Button>
        <Button variant="primary" type="submit" disabled={loading} className="ligandmpnn-submit-btn">
          {loading ? <Spinner animation="border" size="sm" /> : 'Submit Job'}
        </Button>
        {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
        {result && (
          <Alert variant="success" className="mt-3">
            {result.message || 'Job submitted successfully!'}
          </Alert>
        )}
      </form>
      <hr />
      <h3>Your Boltz2 Jobs</h3>
      
      {searchResults.length > 0 ? (
        <div className="vis-search-results" style={{ marginTop: '1rem' }}>
          <ul>
            {searchResults.map(job => (
              <li key={job.jobId} className="vis-job-box">
                <strong>{job.jobTitle || job.jobId}</strong>
                <br />
                Job ID: {job.jobId}
                <br />
                Status: {job.status}
                <br />
                Submitted: {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                {job.status === 'completed' && (
                    <>
                  <button
                    style={{ marginLeft: '1rem' }}
                    onClick={() => handleDownload(job.jobId)}
                  >
                    Download
                  </button>
                  <Button
                    style={{ marginLeft: '1rem' }}
                    onClick={() => window.open(`/boltz-viewer?jobId=${job.jobId}`, '_blank', 'noopener,noreferrer')}
                    >
                        View Complex
                  </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No jobs found.</p>
      )}
    </div>
  );
};

export default Boltz2;