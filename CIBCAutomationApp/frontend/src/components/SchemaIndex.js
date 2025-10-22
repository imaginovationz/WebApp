import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SchemaIndex.css';
import frontendconfig from '../frontendconfig'; // central backend config

const API_BASE = frontendconfig.backendUrl;

export default function SchemaIndex(){
  const [schemas,setSchemas] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const refresh = async () => {
    try{ const res = await fetch(`${API_BASE}/ui/schemas`); if(!res.ok) throw new Error(await res.text()); setSchemas(await res.json()); }
    catch(e){ setError(e.message);} finally { setLoading(false);} };
  useEffect(()=>{
    refresh();
  },[]);
  const deleteSchema = async (schemaName) => {
    if(!window.confirm(`Delete schema "${schemaName}"? This removes its definition and drops its data table if published.`)) return;
    try{ const res = await fetch(`${API_BASE}/ui/schemas/${schemaName}`, { method:'DELETE' }); if(!res.ok && res.status!==204) throw new Error(await res.text()); await refresh(); }
    catch(e){ alert('Delete failed: '+e.message); }
  };
  return (
    <div className="schema-index-wrapper">
      <div className="index-header">
        <h1 className="page-title">Published Schemas</h1>
        <div className="actions">
          <Link className="btn-link" to="/">Main Page</Link>
          <Link className="btn-link" to="/SchemaBuilder">Schema Builder</Link>
        </div>
      </div>
      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">{error}</div>}
      <ul className="schema-index-list">
       {schemas.map(s=> <li key={s.id}><Link to={`/schema/${s.name}`}>{s.name}</Link><button className="mini-btn danger" style={{marginLeft:'8px'}} onClick={()=>deleteSchema(s.name)}>Del</button></li>)}
        {schemas.length===0 && !loading && <li className="empty">No schemas yet. Create one in the builder.</li>}
      </ul>
    </div>
  );
}
