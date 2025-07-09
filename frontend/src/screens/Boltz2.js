import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/authCOntext';
import yaml from 'js-yaml';
import '../styles/boltz.css';

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
    const [manualAc, setManualAc] = useState('');
  const [manualSmiles, setManualSmiles] = useState('');
  const [manualError, setManualError] = useState('');

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
    setManualError('');
    setManualSmiles('');
    if (!ac) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/glycan/smiles/${ac}`);
      if (!res.ok) {
        const err = await res.json();
        setManualError(err.error || 'Not found');
        return;
      }
      const data = await res.json();
      setManualSmiles(data.smiles);
      // Optionally auto-fill the sequence's SMILES field
      handleSeqChange(idx, 'smiles', data.smiles);
    } catch (e) {
      setManualError('Error fetching SMILES');
    }
  };

  function toYAML(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(obj)) {
      return obj.map(item => `${pad}- ${toYAML(item, indent + 1).trimStart()}`).join('\n');
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .filter(([k, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => {
          if (Array.isArray(v) || typeof v === 'object') {
            return `${pad}${k}:\n${toYAML(v, indent + 1)}`;
          }
          return `${pad}${k}: ${v}`;
        }).join('\n');
    } else {
      return `${pad}${obj}`;
    }
  }

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
      .filter(seq => seq.entityType && seq.id)
      .map(seq => {
        const { entityType, ...rest } = seq;
        // Remove empty fields
        const clean = Object.fromEntries(
          Object.entries(rest).filter(([k, v]) =>
            v !== '' && v !== undefined && !(typeof v === 'boolean' && v === false)
          )
        );
        return { [entityType]: clean };
      });

       let parsedProperties = [];
    for (const p of properties.filter(p => p)) {
      try {
        const parsed = yaml.load(p);
        parsedProperties.push(parsed);
      } catch (e) {
        setError('Invalid YAML in properties: ' + e.message);
        setLoading(false);
        return;
      }
    }

    const yamlObj = {
      version: 1,
      sequences: yamlSequences,
      constraints: constraints.filter(c => c),
      templates: templates.filter(t => t),
      properties: properties.filter(p => p)
    };

    const yamlStr = toYAML(yamlObj);
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    yamlFile = new File([blob], 'input.yaml', { type: 'text/yaml' });
  }

    const formData = new FormData();
    formData.append('file', yamlFile);
    formData.append('email', email);
    formData.append('userId', userId);
    formData.append('jobTitle', jobTitle);

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
  const addConstraint = () => setConstraints([...constraints, '']);
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
                    value={manualAc}
                    onChange={e => setManualAc(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fetchSmilesByAc(manualAc, idx)}
                  >
                    Get SMILES
                  </Button>
                </div>
                {manualSmiles && (
                  <div style={{ color: 'green', fontSize: 12, marginTop: 4 }}>
                    SMILES: {manualSmiles}
                  </div>
                )}
                {manualError && (
                  <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
                    {manualError}
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
          <div key={idx} className="ligandmpnn-form-group">
            <input
              className="ligandmpnn-input"
              placeholder="Constraint YAML (e.g. bond: ...)"
              value={c}
              onChange={e => handleConstraintChange(idx, e.target.value)}
              style={{ width: '80%' }}
            />
            <Button size="sm" variant="danger" onClick={() => removeConstraint(idx)} style={{ marginLeft: 8 }}>Remove</Button>
          </div>
        ))}
        <Button size="sm" onClick={addConstraint} style={{ marginBottom: 12 }}>Add Constraint</Button>
        <hr />
        <h4>Templates</h4>
        {templates.map((t, idx) => (
          <div key={idx} className="ligandmpnn-form-group">
            <input
              className="ligandmpnn-input"
              placeholder="Template YAML (e.g. cif: ...)"
              value={t}
              onChange={e => handleTemplateChange(idx, e.target.value)}
              style={{ width: '80%' }}
            />
            <Button size="sm" variant="danger" onClick={() => removeTemplate(idx)} style={{ marginLeft: 8 }}>Remove</Button>
          </div>
        ))}
        <Button size="sm" onClick={addTemplate} style={{ marginBottom: 12 }}>Add Template</Button>
        <hr />
        <h4>Properties</h4>
        {properties.map((p, idx) => (
          <div key={idx} className="ligandmpnn-form-group">
            <input
              className="ligandmpnn-input"
              placeholder="Property YAML (e.g. affinity: ...)"
              value={p}
              onChange={e => handlePropertyChange(idx, e.target.value)}
              style={{ width: '80%' }}
            />
            <Button size="sm" variant="danger" onClick={() => removeProperty(idx)} style={{ marginLeft: 8 }}>Remove</Button>
          </div>
        ))}
        <Button size="sm" onClick={addProperty} style={{ marginBottom: 12 }}>Add Property</Button>
        <hr />
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
                  <button
                    style={{ marginLeft: '1rem' }}
                    onClick={() => handleDownload(job.jobId)}
                  >
                    Download
                  </button>
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