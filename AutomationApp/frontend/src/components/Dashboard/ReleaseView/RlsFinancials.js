// Example: RlsQE.js (copy, change name inside for the others)
import React from 'react';
export default function RlsQE({ release }) {
   return(
      <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Release Financials View</div>
      <div style={{ marginTop: 8 }}>
        {release ? `Welcome to the Release Financials view for ${release}` : "Welcome to the Release Fincncials view for"}
      </div>
    </div>
  );
}
