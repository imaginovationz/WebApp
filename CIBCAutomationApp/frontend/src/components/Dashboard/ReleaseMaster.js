import React, { useEffect, useMemo, useState } from 'react';
import PptxInline from '../common/PptxInline';

export default function ReleaseMaster() {
  const [mode, setMode] = useState('checking'); // 'pptxjs' | 'ppt-local' | 'sharepoint' | 'missing'
  const [src, setSrc] = useState('');

  // Local paths (served from /public/files)
  const localPptx = useMemo(() =>
    `${window.location.origin}/files/${encodeURIComponent('PBPT RM - Master.pptx')}`, []);
  const localPpt = useMemo(() =>
    `${window.location.origin}/files/${encodeURIComponent('PBPT RM - Master.ppt')}`, []);

  // SharePoint file URL (optional fallback)
  const spBase =
    process.env.REACT_APP_SP_RM_MASTER_URL ||
    ''; // leave blank if you don’t want SP fallback
  const spEmbed = useMemo(() => {
    if (!spBase) return '';
    const sep = spBase.includes('?') ? '&' : '?';
    return `${spBase}${sep}action=embedview&wdAllowInteractivity=True&embed=1`; // view; switch to action=edit if allowed
  }, [spBase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Try local .pptx (PPTXjs)
      try {
        const headPptx = await fetch(localPptx, { method: 'HEAD', cache: 'no-cache' });
        if (headPptx.ok) {
          if (!cancelled) { setMode('pptxjs'); setSrc(localPptx); }
          return;
        }
      } catch {}

      // 2) Try local .ppt (can’t render inline reliably; show actions)
      try {
        const headPpt = await fetch(localPpt, { method: 'HEAD', cache: 'no-cache' });
        if (headPpt.ok) {
          if (!cancelled) { setMode('ppt-local'); setSrc(localPpt); }
          return;
        }
      } catch {}

      // 3) Fallback to SharePoint (if provided)
      if (spEmbed && !cancelled) {
        setMode('sharepoint'); setSrc(spEmbed); return;
      }

      if (!cancelled) { setMode('missing'); setSrc(''); }
    })();
    return () => { cancelled = true; };
  }, [localPptx, localPpt, spEmbed]);

  // ------------ render ------------
  if (mode === 'pptxjs') {
    return (
      <div style={{ height: '78vh', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 8 }}>
        <div className="muted">Rendering local <b>.pptx</b> with PPTXjs (in-page)</div>
        <div style={{ borderRadius: 12, overflow: 'auto', border: '1px solid #26334a', background: '#0f162a' }}>
          <PptxInline url={src} /> {/* [PH1-PPTXJS] */}
        </div>
      </div>
    );
  }

  if (mode === 'ppt-local') {
    const openInDesktop = `ms-powerpoint:ofe|u|${encodeURIComponent(src)}`;
    return (
      <div style={{ height: '78vh', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className="muted">Local <b>.ppt</b> detected (legacy format).</span>
          <a className="go-btn" href={openInDesktop}>Open in PowerPoint (Desktop)</a>
          <a className="go-btn" href={src} download>Download .ppt</a>
          <span className="muted" style={{ marginLeft: 'auto' }}>
            For inline view, place a <b>.pptx</b> copy under <code>/public/files/</code>.
          </span>
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #26334a', background: '#0f162a' }}>
          <div style={{ padding:16, color:'#e5e7eb' }}>
            Browsers don’t reliably render <code>.ppt</code> inline. Use the buttons above,
            or add a <b>.pptx</b> version to enable in-page rendering.
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'sharepoint') {
    return (
      <div style={{ height: '78vh', borderRadius: 12, overflow: 'hidden', background: '#0f162a' }}>
        <iframe
          title="PBPT RM - Master (SharePoint)"
          src={src}
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="clipboard-read; clipboard-write; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div style={{
      padding:16, background:'#0f162a', color:'#e5e7eb',
      borderRadius:12, border:'1px solid #26334a'
    }}>
      <div style={{ fontWeight:700, marginBottom:8 }}>File not found.</div>
      <ol style={{ margin:0, paddingLeft:18, lineHeight:1.65 }}>
        <li>Place <b>PBPT RM - Master.pptx</b> in <code>frontend/public/files/</code> for inline rendering.</li>
        <li>Or place <b>PBPT RM - Master.ppt</b> (legacy) to get Desktop open/download actions.</li>
        <li>Optionally set <code>REACT_APP_SP_RM_MASTER_URL</code> for SharePoint embed fallback.</li>
      </ol>
    </div>
  );
}


