import React from 'react';
export default function ProjectQE({ project }) {
  const label = project ? `${project.intake_number} — ${project.intake_name}` : "";
  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Project BSA View</div>
      <div style={{ marginTop: 8 }}>
        {label ? `Welcome to the Project BSA view for ${label}` : "Welcome to the Project BSA view for"}
      </div>
    </div>
  );
}


