import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
  const services = [
    {
      title: "Protein Structure Prediction",
      description: "Predict high-accuracy 3D protein structures using AlphaFold3. Upload FASTA sequences or files and obtain 3D models with confidence metrics. Every user is required to obtain model parameters from DeepMind.",
      icon: "🧬",
      link: "/vis",
      features: [
        "Supports AlphaFold3",
        "Per-residue confidence scores (pLDDT)",
        "Interactive 3D visualization",
        "Email alerts on job completion"
      ]
    },
    {
      title: "Multi-Entity Protein-Ligand Design",
      description: "Design and optimize protein, DNA, RNA, and ligand complexes Design proteins and dock ligands using the Boltz2 deep learning platform. Supports multi-entity complexes with flexible constraints and property-guided optimization. the Boltz2 deep learning platform. Boltz2 supports multi-entity inputs, advanced constraints, and property-driven design for next-generation biomolecular engineering.",
      icon: "🔗",
      link: "/boltz",
      features:[
        "Supports predicting protein complexes with ligands, nucleic acids, and glycans",
         "Deeplearning–based docking and sequence design",
         "Supports YAML and FASTA input formats",
         "Downloadable results with job tracking"

      ],
    },
    {
      title: "Protein Design",
      description: "Design proteins that bind to a specific ligand. Upload PDB files and customize model settings for context-specific sequence generation.",
      icon: "🧪",
      link: "/ligandMPNN",
      features: [
        "Ligand-aware sequence design using LigandMPNN",
        "Supports multi-chain inputs",
        "Adjustable temperature and number of designs",
        "Selectable model checkpoints",
        "Downloadable sequences and scores"
      ],
      
    },
    {
      title: "GlyDockStudio",
      description: "Predict how glycans bind to protein targets using specialized docking tools for glycoscience research and drug development.",
      icon: "🔮",
      link: "#",
      features: [
        "Accurate glycan docking to protein binding sites",
        "Estimation of binding affinities",
        "Visualization of predicted glycan-protein complexes",
        "Support for flexible glycan and protein conformations"
      ],
      comingSoon: true
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Biomolecular Simulation and Machine Learning Group Workbench</h1>
        <p>
        &quot;Welcome to the Biomolecular Simulation and Machine Learning Group Workbench — a
            web platform for protein structure prediction, glycan docking, and molecular design. Our
            integrated pipelines support drug discovery and protein engineering through cutting-
            edge tools like AlphaFold3, LigandMPNN, and Boltz-2.&quot;
        </p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => (
          <div className={`service-card ${service.comingSoon ? 'coming-soon' : ''}`} key={index}>
            <div className="service-header">
              <span className="service-icon">{service.icon}</span>
              <h2>{service.title}</h2>
              {service.comingSoon && <span className="coming-soon-badge">Coming Soon</span>}
            </div>
            <p className="service-description">{service.description}</p>
            
            <h3>Features</h3>
            <ul className="feature-list">
              {service.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            
            {!service.comingSoon ? (
              <Link to={service.link} className="service-button">
                Launch Tool
              </Link>
            ) : (
              <button disabled className="service-button disabled">
                Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="dashboard-footer">
        <h2>About Our Platform</h2>
        <p>
            The Biomolecular Simulation and Machine Learning Group Workbench is a glyco-
            oriented platform that integrates advanced AI-driven analysis and interactive molecular
            visualization to accelerate research in glycoscience, structural biology, and drug design.
            Our user-friendly tools support researchers at all expertise levels, enabling discoveries
            in glycan-related biomolecular interactions and diagnostics.
        </p>
        <p>
          For questions or support, please contact <a href="mailto:sushil@olemiss.edu">sushil@olemiss.edu</a>
        </p>
        <p> © 2025 MolSim Group, Department of Biomedical Engineering, University of
Mississippi. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Dashboard;