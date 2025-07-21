import React from "react";
import '../styles/tutorials.css';                                                                                                                                            

function Tutorials() {
  return (
    <div className="tutorials-container" style={{ maxWidth: 900, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <h1 style={{ color: "#00008b", marginBottom: 24 }}>Workbench Tutorials</h1>
      <p>
        Welcome to the Biomolecular Simulation and Machine Learning Group Workbench tutorials! Here you’ll find step-by-step guides for using our platform’s main features, including protein structure prediction, ligand docking, and complex design.
      </p>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>1. Protein Structure Prediction (AlphaFold3)</h2>
      <ol>
        <li>Navigate to <strong>AlphaFold3</strong> from the Homepage.</li>
        <li>Enter a job title and your email address.</li>
        <li>Paste your protein sequence in FASTA format or upload a <code>.fasta</code>/<code>.fa</code>/<code>.json</code> file.</li>
        <li>Click <strong>Upload</strong> to submit your job.</li>
        <li>Monitor your job status in the “Your Jobs” section. When complete, download your results or view the 3D structure.</li>
      </ol>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>2. Multi-Entity Protein-Ligand Design (Boltz2)</h2>
      <ol>
        <li>Go to <strong>Complex prediction</strong> in the Homepage.</li>
        <li>Fill in the job title and upload a YAML or FASTA file, or use the form to enter sequences, templates, and constraints.</li>
        <li>Optionally, upload template CIF files and specify chain IDs.</li>
        <li>Click <strong>Submit Job</strong>. You’ll see your job in the “Your Boltz2 Jobs” list.</li>
        <li>Once finished, download results or visualize the predicted complex.</li>
      </ol>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>3. Ligand-Aware Protein Design (LigandMPNN)</h2>
      <ol>
        <li>Select <strong>Ligand MPNN</strong> from the Homepage.</li>
        <li>Enter a job title and upload your PDB file.</li>
        <li>Adjust model parameters as needed.</li>
        <li>Click <strong>Submit Job</strong> to start the design process.</li>
        <li>Track your jobs and download designed sequences and scores when ready.</li>
      </ol>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>4. Glycan Docking (Coming Soon)</h2>
      <p>
        The GlyDockStudio tool for glycan-protein docking will be available soon. Stay tuned!
      </p>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>Tips &amp; Troubleshooting</h2>
      <ul>
        <li>Make sure your input files are in the correct format (<code>.fasta</code>, <code>.json</code>, <code>.pdb</code>, <code>.cif</code>).</li>
        <li>For large jobs, processing may take several minutes. You’ll receive an email when your job is complete.</li>
        <li>If you encounter errors, check your input format and try again. For persistent issues, contact <a href="mailto:sushil@olemiss.edu">sushil@olemiss.edu</a>.</li>
        <li>Use the “Download” buttons to save your results locally.</li>
        <li>For 3D visualization, use the built-in viewer on the results page.</li>
      </ul>

      <h2 style={{ color: "#00008b", marginTop: 32 }}>Need Help?</h2>
      <p>
        For more detailed documentation or support, please contact <a href="mailto:sushil@olemiss.edu">sushil@olemiss.edu</a>.
      </p>
    </div>
  );
}

export default Tutorials;