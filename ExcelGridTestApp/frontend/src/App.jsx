import React from "react";
import ExcelEditor from "./components/ExcelEditor";

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ padding: 12, margin: 0 }}>Excel Grid Test</h2>
      <ExcelEditor
        initialXlsxUrl={"/files/DSR%20Builder%20-%20CBPT_DEP%20v%200.9.6.10.xlsm"}  
        defaultSheet="Daily Target"
        // showDownload   // leave commented to keep download hidden
      />
    </div>
  );
}
