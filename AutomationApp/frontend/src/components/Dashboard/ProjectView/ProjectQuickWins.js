import React from 'react';

export default function ProjectQuickWins({ project }) {
  if (!project) {
    return <div className="muted">Select a project to view Quick Wins.</div>;
  }
  return (
    <div>
      <div className="muted" style={{ marginBottom: 8 }}>
        Quick Wins for <b>{project.intake_number} — {project.intake_name}</b>
      </div>
      <div className="tab-panel">
        <div className="muted">Quick Wins content goes here (to be implemented).</div>
      </div>
    </div>
  );
}
