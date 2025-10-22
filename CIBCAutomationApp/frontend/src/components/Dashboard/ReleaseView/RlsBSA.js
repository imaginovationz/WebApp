import React from 'react';
export default function RlsQE({ release }) {
   return(
      <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">Release BSA View</div>
      <div style={{ marginTop: 8 }}>
        {release ? `Welcome to the Release BSA view for ${release}` : "Welcome to the Release BSA view for"}
      </div>
    </div>
  );

}


