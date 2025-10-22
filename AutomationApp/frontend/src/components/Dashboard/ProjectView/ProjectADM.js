// Example: ProjectQE.js (copy, change name/text inside for the others)
import React from 'react';
export default function ProjectQE({ project }) {
  const label = project ? `${project.intake_number} — ${project.intake_name}` : "";
  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Project ADM View</div>
      <div style={{ marginTop: 8 }}>
        {label ? `Welcome to the Project ADM view for ${label}` : "Welcome to the Project ADM view for"}
      </div>
    </div>
  );
}
