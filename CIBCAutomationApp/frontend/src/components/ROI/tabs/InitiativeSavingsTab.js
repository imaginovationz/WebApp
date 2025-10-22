import React, { useEffect, useMemo, useState } from "react";
import "../../../styles/roiTabs.css";
export default function InitiativeSavingsTab() {
  const RATE_R1 = 27.85;
  const RATE_R2 = 66.63;
  const roundUp2 = (x) => Math.ceil((Number(x) || 0) * 100) / 100;

  // TDM
  const [tdm, setTdm] = useState({ N: 0, N1: 0, N2: 0, N3: 0, PD1: 0, C1: 0, PD2: 0, C2: 0, Savings: 0 });
  useEffect(() => {
    const PD1 = tdm.N1 ? roundUp2(tdm.N / tdm.N1) : 0;
    const C1 = PD1 * 8 * (RATE_R1 + 0.15 * RATE_R2);
    const PD2 = tdm.N2 ? roundUp2(tdm.N / tdm.N2) : 0;
    const C2 = PD2 * 8 * (RATE_R1 + 0.15 * RATE_R2);
    const S = (C1 - C2) * (Number(tdm.N3) || 0);
    setTdm((p) => ({ ...p, PD1, C1, PD2, C2, Savings: S }));
  }, [tdm.N, tdm.N1, tdm.N2, tdm.N3]); // ← removed eslint-disable-next-line

  const mkRow = () => ({ Dropdown1: "", Dropdown2: "", Dropdown3: "", N: 100, N1: 100, N2: 100, N3: 100, PD1: 0, C1: 0, PD2: 0, C2: 0, Savings: 0 });
  const [prepRows, setPrepRows] = useState([mkRow()]);
  const [ditRows, setDitRows] = useState([mkRow()]);
  const [sitRows, setSitRows] = useState([mkRow()]);
  const [uatRows, setUatRows] = useState([mkRow()]);

  const recompute = (rows, coeff) =>
    rows.map((r) => {
      const PD1 = r.N1 ? roundUp2(r.N / r.N1) : 0;
      const C1 = PD1 * 8 * (RATE_R1 + coeff * RATE_R2);
      const PD2 = r.N2 ? Number(r.N) / Number(r.N2) : 0;
      const C2 = PD2 * 8 * (RATE_R1 + coeff * RATE_R2);
      const S = (C1 - C2) * (Number(r.N3) || 0);
      return { ...r, PD1, C1, PD2, C2, Savings: S };
    });

  useEffect(() => { setPrepRows((rows) => recompute(rows, 0.25)); }, [prepRows.length]);
  useEffect(() => { setDitRows((rows) => recompute(rows, 0.25)); }, [ditRows.length]);
  useEffect(() => { setSitRows((rows) => recompute(rows, 0.25)); }, [sitRows.length]);

  const recomputeUAT = (rows) =>
    rows.map((r) => {
      const PD1 = r.N1 ? roundUp2(r.N / r.N1) : 0;
      const C1 = PD1 * 8 * (RATE_R1 + 0.25 * RATE_R2);
      const PD2 = r.N2 ? Number(r.N) / Number(r.N2) : 0;
      const C2 = PD2 * 8 * (RATE_R1 + 0.25 * RATE_R2);
      let base = C1 - C2;
      if (!r.N) base = 0;
      const S = base * (Number(r.N3) || 0);
      return { ...r, PD1, C1, PD2, C2, Savings: S };
    });
  useEffect(() => { setUatRows((rows) => recomputeUAT(rows)); }, [uatRows.length]);

  const updateRow = (rows, setRows, idx, key, val, coeff = 0.25, isUAT = false) => {
    const copy = [...rows];
    copy[idx] = { ...copy[idx], [key]: val };
    setRows(isUAT ? recomputeUAT(copy) : recompute(copy, coeff));
  };
  const addRow = (setRows) => setRows((prev) => [...prev, mkRow()]);

  const total = useMemo(() => {
    const sum = (a) => a.reduce((s, r) => s + (Number(r.Savings) || 0), 0);
    return (tdm.Savings || 0) + sum(prepRows) + sum(ditRows) + sum(sitRows) + sum(uatRows);
  }, [tdm, prepRows, ditRows, sitRows, uatRows]);

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">TDM Savings</div>
      <div className="grid-2">
        <label className="tab-label tab-label-green">Total deal count (N)</label>
        <input className="tab-input" type="number" value={tdm.N} onChange={(e) => setTdm({ ...tdm, N: Number(e.target.value) })} />
        <label className="tab-label tab-label-green">Manual Deal/day (N1)</label>
        <input className="tab-input" type="number" value={tdm.N1} onChange={(e) => setTdm({ ...tdm, N1: Number(e.target.value) })} />
        <label className="tab-label tab-label-orange">PD1 = ROUNDUP(N/N1,2)</label>
        <input className="tab-input tab-input-orange" value={tdm.PD1} disabled />
        <label className="tab-label tab-label-orange">C1 = PD1*8*(R1+0.15*R2)</label>
        <input className="tab-input tab-input-orange" value={tdm.C1} disabled />
        <label className="tab-label tab-label-green">Avg Automation/day (N2)</label>
        <input className="tab-input" type="number" value={tdm.N2} onChange={(e) => setTdm({ ...tdm, N2: Number(e.target.value) })} />
        <label className="tab-label tab-label-orange">PD2 = ROUNDUP(N/N2,2)</label>
        <input className="tab-input tab-input-orange" value={tdm.PD2} disabled />
        <label className="tab-label tab-label-orange">C2 = PD2*8*(R1+0.15*R2)</label>
        <input className="tab-input tab-input-orange" value={tdm.C2} disabled />
        <label className="tab-label tab-label-green">Number of cycles (N3)</label>
        <input className="tab-input" type="number" value={tdm.N3} onChange={(e) => setTdm({ ...tdm, N3: Number(e.target.value) })} />
        <label className="tab-label tab-label-orange">Savings = (C1 - C2) * N3</label>
        <input className="tab-input tab-input-orange" value={tdm.Savings} disabled />
      </div>

      <div className="grid-2 mt-2">
        <label className="tab-label tab-label-orange">Total Savings</label>
        <input className="tab-input tab-input-orange" value={total} disabled />
      </div>

      {/* Automation sections with Add Row + Dropdowns */}
      {[
        { title: "Test Prep", rows: prepRows, setRows: setPrepRows, isUAT: false },
        { title: "Execution DIT", rows: ditRows, setRows: setDitRows, isUAT: false },
        { title: "Execution SIT", rows: sitRows, setRows: setSitRows, isUAT: false },
        { title: "Execution UAT", rows: uatRows, setRows: setUatRows, isUAT: true },
      ].map((sec) => (
        <div className="tab-subsection" key={sec.title}>
          <div className="tab-subtitle">{sec.title}</div>
          <div className="tab-row-actions">
            <button className="btn-red" onClick={() => addRow(sec.setRows)}>&lt;Add Row&gt;</button>
            <select className="select-red"><option value="">{`<Dropdown1>`}</option></select>
            <select className="select-red"><option value="">{`<Dropdown2>`}</option></select>
            <select className="select-red"><option value="">{`<Dropdown3>`}</option></select>
          </div>
          {sec.rows.map((r, i) => (
            <div key={`${sec.title}-${i}`} className="grid-8">
              <input className="tab-input" type="number" value={r.N}  onChange={(e) => updateRow(sec.rows, sec.setRows, i, "N",  Number(e.target.value), 0.25, sec.isUAT)} placeholder="N" />
              <input className="tab-input" type="number" value={r.N1} onChange={(e) => updateRow(sec.rows, sec.setRows, i, "N1", Number(e.target.value), 0.25, sec.isUAT)} placeholder="N1" />
              <input className="tab-input tab-input-orange" value={r.PD1} disabled />
              <input className="tab-input tab-input-orange" value={r.C1} disabled />
              <input className="tab-input" type="number" value={r.N2} onChange={(e) => updateRow(sec.rows, sec.setRows, i, "N2", Number(e.target.value), 0.25, sec.isUAT)} placeholder="N2" />
              <input className="tab-input tab-input-orange" value={r.PD2} disabled />
              <input className="tab-input tab-input-orange" value={r.C2} disabled />
              <input className="tab-input" type="number" value={r.N3} onChange={(e) => updateRow(sec.rows, sec.setRows, i, "N3", Number(e.target.value), 0.25, sec.isUAT)} placeholder="N3" />
              <input className="tab-input tab-input-orange" value={r.Savings} disabled />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
