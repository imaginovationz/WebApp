import React, { useState } from "react";
import "../../../styles/roiTabs.css";


export default function SOASavingsTab() {
  const [form, setForm] = useState({
    // add green inputs here as per Tab4
    formsCount: "",
    execCount: "",
    withStubPD: "",
    withoutStubPD: "",
    // computed
    totalWith: 0,
    totalWithout: 0,
    savingsDays: 0,
    savingsDollar: 0
  });

  const RATE_PER_DAY = 1000;
  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  React.useEffect(() => {
    const c = Number(form.execCount || 0);
    const w = Number(form.withStubPD || 0);
    const wo = Number(form.withoutStubPD || 0);
    const totalWith = c * w;
    const totalWithout = c * wo;
    const sDays = Math.max(totalWithout - totalWith, 0);
    const s$ = sDays * RATE_PER_DAY;

    setForm((p) => ({ ...p, totalWith, totalWithout, savingsDays: sDays, savingsDollar: s$ }));
  }, [form.execCount, form.withStubPD, form.withoutStubPD]);

  return (
    <div className="tab-wrap">
      <div className="tab-section tab-section-yellow">SOA Savings</div>
      <div className="grid-2">
        <label className="tab-label tab-label-green"># Total Unique Forms</label>
        <input className="tab-input" type="number" value={form.formsCount} onChange={(e) => onChange("formsCount", e.target.value)} />

        <label className="tab-label tab-label-green"># Test Case execution Count</label>
        <input className="tab-input" type="number" value={form.execCount} onChange={(e) => onChange("execCount", e.target.value)} />

        <label className="tab-label tab-label-green">With Stub per day</label>
        <input className="tab-input" type="number" value={form.withStubPD} onChange={(e) => onChange("withStubPD", e.target.value)} />

        <label className="tab-label tab-label-green">Without Stub per day</label>
        <input className="tab-input" type="number" value={form.withoutStubPD} onChange={(e) => onChange("withoutStubPD", e.target.value)} />

        <label className="tab-label tab-label-orange"># Total Days of effort - With Stub</label>
        <input className="tab-input tab-input-orange" value={form.totalWith} disabled />

        <label className="tab-label tab-label-orange"># Total Days of effort - Without Stub</label>
        <input className="tab-input tab-input-orange" value={form.totalWithout} disabled />

        <label className="tab-label tab-label-orange">Savings in Days</label>
        <input className="tab-input tab-input-orange" value={form.savingsDays} disabled />

        <label className="tab-label tab-label-orange">Savings in Dollar Value</label>
        <input className="tab-input tab-input-orange" value={form.savingsDollar} disabled />
      </div>
    </div>
  );
}
