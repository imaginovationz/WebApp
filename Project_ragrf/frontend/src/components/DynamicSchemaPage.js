import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/DynamicSchemaPage.css';

import frontendconfig from '../frontendconfig'; // central backend config

const API_BASE = frontendconfig.backendUrl;
async function apiFetch(path, options={}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const ct = res.headers.get('content-type')||'';
  const txt = await res.text();
  let json; if (ct.includes('application/json')) { try { json = JSON.parse(txt); } catch {} }
  if(!res.ok){ throw new Error(json?.error || json?.message || txt.slice(0,300)); }
  return json !== undefined ? json : txt;
}

export default function DynamicSchemaPage(){
  const { name } = useParams();
  const [schema,setSchema] = useState(null);
  const [rows,setRows] = useState([]);
  const [editing,setEditing] = useState(null);
  const [error,setError] = useState(null);

  const load = async () => {
    try { const sc = await apiFetch(`/ui/schemas/${name}`); setSchema(sc); } catch(e){ setError(e.message);} 
    try { const data = await apiFetch(`/ui/data/${name}`); setRows(data); } catch(e){ /* ignore until publish */ }
  };
  useEffect(()=>{ load(); },[name]);

  const submit = async (e) => {
    e.preventDefault(); if(!schema) return; const payload={};
    schema.schema.fields.forEach(f=> payload[f.name] = e.target[f.name]?.value || '');
    try { await apiFetch(`/ui/data/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); e.target.reset(); await load(); }
    catch(e){ alert(e.message);} }

  const save = async (id) => {
    try { await apiFetch(`/ui/data/${name}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editing)}); setEditing(null); await load(); }
    catch(e){ alert(e.message);} }

  const del = async (id) => { if(!window.confirm('Delete?')) return; try { await apiFetch(`/ui/data/${name}/${id}`, { method:'DELETE'}); await load(); } catch(e){ alert(e.message);} };

  return (
    <div className="dyn-schema-wrapper">
      <div className="top-bar">
        <h1 className="page-title">Schema: {name}</h1>
        <div className="nav-links">
          <Link className="back-link" to="/">⟵ Main Page</Link>
          <Link className="back-link" to="/SchemaBuilder">Builder</Link>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!schema && !error && <div className="loading">Loading schema...</div>}
      {schema && (
        <div className="content-stack">
          <div className="card entry-card full-width">
            <div className="card-title">Add Record</div>
            <form onSubmit={submit} className="entry-form">
              <div className="field-grid">
                {schema.schema.fields.map(f=> {
                  const inputId = `field_${f.name}`;
                  return (
                    <div key={f.name} className="field-item inline">
                      <label htmlFor={inputId} className="field-label inline">{f.label}{f.required && <span className="req">*</span>}</label>
                      <input id={inputId} className="text-input inline" name={f.name} placeholder={f.label} required={f.required} />
                    </div>
                  );
                })}
              </div>
              <div className="form-actions">
                <button type='submit' className="btn primary">Add</button>
              </div>
            </form>
          </div>
          <div className="card table-card full-width">
            <div className="card-title">Data</div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {schema.schema.fields.map(f=> <th key={f.name}>{f.label}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r=> (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      {schema.schema.fields.map(f=> (
                        <td key={f.name}>
                          {editing?.id===r.id ? (
                            <input className="inline-edit" value={editing[f.name]||''} onChange={e=>setEditing({...editing,[f.name]:e.target.value})} />
                          ) : r[f.name]}
                        </td>
                      ))}
                      <td className="row-actions">
                        {editing?.id===r.id ? (
                          <>
                            <button className="mini-btn" onClick={()=>save(r.id)}>Save</button>
                            <button className="mini-btn" onClick={()=>setEditing(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="mini-btn" onClick={()=>setEditing(r)}>Edit</button>
                            <button className="mini-btn danger" onClick={()=>del(r.id)}>Del</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length===0 && <tr><td colSpan={schema.schema.fields.length+2} className="empty-msg">No data (publish first if not already).</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
