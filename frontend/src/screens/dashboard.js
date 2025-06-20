import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
  const services = [
    {
      title: "AlphaFold3 Protein Structure Prediction",
      description: "Generate accurate 3D protein structure predictions using Meta's AlphaFold3 technology. Upload FASTA sequences or files to predict protein structures with confidence scores.",
      icon: "🧬",
      link: "/vis",
      features: [
        "State-of-the-art protein structure prediction",
        "Confidence scores (pLDDT) for assessment of prediction quality",
        "Interactive 3D visualization of results",
        "Email notifications when predictions complete"
      ]
    },
    {
      title: "Protein Visualization & Analysis",
      description: "Explore and analyze protein structures using our interactive visualization tools. Search for proteins via UniProt IDs and view their 3D structures in various representations.",
      icon: "🔬",
      link: "/glygen",
      features: [
        "Search proteins by UniProt ID",
        "View protein sequences and structural information",
        "Multiple visualization styles (cartoon, stick, surface)",
        "Color schemes by property or residue type"
      ]
    },
    {
      title: "AutoDock Vina (Coming Soon)",
      description: "Molecular docking simulation for drug discovery applications. Predict how small molecules bind to target proteins.",
      icon: "🔮",
      link: "#",
      features: [
        "Predict protein-ligand interactions",
        "Calculate binding affinities",
        "Visualize docking poses",
        "Support for flexible docking"
      ],
      comingSoon: true
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Biomedical Informatics & AI Platform</h1>
        <p>
          Welcome to the University of Mississippi Biomedical Engineering research computing platform.
          Our tools help researchers analyze proteins, predict structures, and accelerate drug discovery.
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
          The University of Mississippi Biomedical Engineering computation platform integrates cutting-edge
          AI and molecular visualization technologies to accelerate research in structural biology
          and drug discovery. Our tools are designed to be accessible to researchers at all technical levels.
        </p>
        <p>
          For questions or support, please contact <a href="mailto:support@bme.olemiss.edu">support@bme.olemiss.edu</a>
        </p>
      </div>
    </div>
  );
}

export default Dashboard;