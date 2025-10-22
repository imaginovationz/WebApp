import React, { useState, useEffect } from 'react';
import '../styles/SchemaBuilder.css';
import frontendconfig from '../frontendconfig'; // central backend config

const API_BASE = frontendconfig.backendUrl;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const ct = res.headers.get('content-type') || '';
  const raw = await res.text();
  let data = null;
  if (ct.includes('application/json')) {
    try { data = JSON.parse(raw); } catch {/* ignore */}
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || raw.slice(0,300);
    throw new Error(msg);
  }
  return data !== null ? data : raw;
}

// Simple dynamic form / schema builder placeholder
export default function SchemaBuilder() {
  const [name, setName] = useState('example_form');
  const [fields, setFields] = useState([{ label: 'Title', name: 'title', type: 'string', required: true }]);
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [backendSnippet, setBackendSnippet] = useState(null);
  const [publishedInfo, setPublishedInfo] = useState(null);
  const [dataRows, setDataRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);

  const addField = () => {
    setFields([...fields, { label: 'New Field', name: 'new_field_' + (fields.length+1), type: 'string', required: false }]);
  };
  const updateField = (idx, key, value) => {
    const next = fields.map((f,i) => i===idx ? { ...f, [key]: value } : f);
    setFields(next);
  };
  const removeField = (idx) => setFields(fields.filter((_,i)=>i!==idx));

  const saveSchema = async () => {
    try {
      const payload = { name, schema: { fields } };
      await apiFetch('/ui/schemas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)});
      await loadSchemas();
      alert('Saved');
    } catch (e) { alert('Error saving schema: ' + e.message); }
  };
  const loadSchemas = async () => { try { setSchemas(await apiFetch('/ui/schemas')); } catch(e){ console.warn(e); } };
  useEffect(()=>{ loadSchemas(); },[]);
  const deleteSchema = async (schemaName) => {
    if(!window.confirm(`Delete schema "${schemaName}"? This also drops its data table if published.`)) return;
    try { await apiFetch(`/ui/schemas/${schemaName}`, { method:'DELETE' }); if(selectedSchema?.name===schemaName){ setSelectedSchema(null); } await loadSchemas(); alert('Schema deleted'); } catch(e){ alert('Delete failed: '+e.message);} }

  const generateBackend = async (schemaName) => { 
    try { 
      const d = await apiFetch(`/ui/generate_backend/${schemaName}`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) }); 
      setBackendSnippet(d.model_snippet); 
    } catch(e){ alert('Generation failed: '+e.message);} 
  };
  const publishSchema = async (schemaName) => {
    try {
      const info = await apiFetch(`/ui/publish/${schemaName}`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) });
      setPublishedInfo(info);
      await refreshData(schemaName);
      alert('Published');
    } catch(e){ alert('Publish failed: '+e.message);}  
  };
  const refreshData = async (schemaName=name) => {
    try { const data = await apiFetch(`/ui/data/${schemaName}`); setDataRows(data); } catch(e){ setDataRows([]); }
  };
  const submitData = async (e) => {
    e.preventDefault();
    const payload = {};
    fields.forEach(f=> payload[f.name]= e.target[f.name]?.value || '');
    try { await apiFetch(`/ui/data/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); await refreshData(); e.target.reset(); } catch(err){ alert('Save failed: '+err.message);}  
  };
  const startEdit = (row) => { setEditingRow(row); };
  const saveEdit = async (id) => {
    try { await apiFetch(`/ui/data/${name}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editingRow)}); setEditingRow(null); await refreshData(); } catch(err){ alert('Update failed: '+err.message);}  
  };
  const deleteRow = async (id) => { if(!window.confirm('Delete?')) return; try { await apiFetch(`/ui/data/${name}/${id}`, { method:'DELETE'}); await refreshData(); } catch(err){ alert('Delete failed: '+err.message);} };

  const loadSchema = async (schemaName) => { try { const d = await apiFetch(`/ui/schemas/${schemaName}`); setName(d.name); setFields(d.schema.fields||[]); setSelectedSchema(d);} catch(e){ alert('Load failed: '+e.message);} };

  return (
    <div className="schema-page-wrapper">
      <div className="page-header-bar">
        <h1 className="page-title">Schema Builder</h1>
        <div className="page-header-actions">
          <a className="header-link" href="/">⟵ Main Page</a>
        </div>
      </div>
      <div className="top-layout">
        <div className="builder-col schema-card">
          <div className="form-row single inline">
            <label className="form-label inline-label">Schema Name<span className="req">*</span></label>
            <div className="inline-input"><input className="form-input" value={name} onChange={e=>setName(e.target.value)} /></div>
          </div>
          <div className="section-header">Fields</div>
          <div className="fields-table-header">
            <div>Label</div>
            <div>Field Name</div>
            <div>Type</div>
            <div>Required</div>
            <div></div>
          </div>
          <div className="fields-table-body">
            {fields.map((f,i)=>(
              <div key={i} className="field-row">
                <input className="form-input" value={f.label} onChange={e=>updateField(i,'label',e.target.value)} placeholder='Label' />
                <input className="form-input" value={f.name} onChange={e=>updateField(i,'name',e.target.value)} placeholder='name' />
                <select className="form-select" value={f.type} onChange={e=>updateField(i,'type',e.target.value)}>
                  <option>string</option>
                  <option>text</option>
                  <option>int</option>
                  <option>float</option>
                  <option>date</option>
                  <option>datetime</option>
                  <option>bool</option>
                </select>
                <div className="center">
                  <input type='checkbox' checked={f.required} onChange={e=>updateField(i,'required',e.target.checked)} />
                </div>
                <div className="center">
                  <button type="button" className="btn btn-danger btn-small" onClick={()=>removeField(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="actions-bar">
            <button type="button" className="btn" onClick={addField}>Add Field</button>
            <div className="spacer" />
            <button type="button" className="btn btn-secondary" onClick={saveSchema}>Save Schema</button>
            <button type="button" className="btn btn-primary" onClick={()=>publishSchema(name)}>Publish</button>
          </div>
        </div>
        <div className="side-col">
          <div className="panel">
            <div className="panel-title">Existing Schemas</div>
            <ul className="schema-list">
              {schemas.map(s=> (
                <li key={s.id} className={selectedSchema?.name===s.name? 'active' : ''}>
                  <button className="link-btn" onClick={()=>loadSchema(s.name)}>{s.name}</button>
                  <button className="mini-btn" onClick={()=>generateBackend(s.name)}>Gen</button>
                  <button className="mini-btn danger" onClick={()=>deleteSchema(s.name)}>Del</button>
                </li>
              ))}
            </ul>
          </div>
          {backendSnippet && (
            <div className="panel">
              <div className="panel-title">Generated Model Snippet</div>
              <pre className="code-preview">{backendSnippet}</pre>
            </div>
          )}
        </div>
      </div>
      <div className="below-panels">
          {selectedSchema && (
            <div className="panel">
              <div className="panel-title">Preview: {selectedSchema.name}</div>
              <form className="preview-form" onSubmit={e=>e.preventDefault()}>
                {selectedSchema.schema.fields.map((f,i)=>(
                  <div key={i} className="form-row">
                    <label className="form-label">{f.label}{f.required && <span className="req">*</span>}</label>
                    <input className="form-input" name={f.name} required={f.required} />
                  </div>
                ))}
                <div className="form-row">
                  <button type='submit' className="btn btn-primary">Submit (demo)</button>
                </div>
              </form>
            </div>
          )}
          {publishedInfo && (
            <div className="panel">
              <div className="panel-title">Data for {name}</div>
              <form onSubmit={submitData} className="data-entry-form">
                {fields.map((f,i)=>(
                  <div key={i} className="form-row compact">
                    <label className="form-label small">{f.label}</label>
                    <input className="form-input" name={f.name} placeholder={f.label} />
                  </div>
                ))}
                <div className="form-row">
                  <button type='submit' className="btn btn-primary">Add Record</button>
                  <button type='button' className="btn btn-secondary" onClick={()=>refreshData()}>Refresh</button>
                </div>
              </form>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      {fields.map(f=> <th key={f.name}>{f.label}</th>)}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map(r=> (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        {fields.map(f=> (
                          <td key={f.name}>
                            {editingRow?.id===r.id ? (
                              <input className="inline-edit" value={editingRow[f.name]||''} onChange={e=>setEditingRow({...editingRow, [f.name]: e.target.value})} />
                            ) : r[f.name]}
                          </td>
                        ))}
                        <td className="row-actions">
                          {editingRow?.id===r.id ? (
                            <>
                              <button type="button" className="mini-btn" onClick={()=>saveEdit(r.id)}>Save</button>
                              <button type="button" className="mini-btn" onClick={()=>setEditingRow(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="mini-btn" onClick={()=>startEdit(r)}>Edit</button>
                              <button type="button" className="mini-btn danger" onClick={()=>deleteRow(r.id)}>Del</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
