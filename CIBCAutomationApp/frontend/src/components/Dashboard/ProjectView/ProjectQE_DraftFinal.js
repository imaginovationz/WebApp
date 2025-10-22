// src/components/Dashboard/ProjectView/ProjectQE.js
import React, { useEffect, useMemo, useRef, useState } from 'react';

import * as pbi from 'powerbi-client';
const { service, factories, models } = pbi;
import "../../../styles/roiTabs.css";
import "../../../styles/RecordEntry.css";
import "../../../styles/Dashboard.css";

/* ------------------------------------------------------------------
   POWER BI EMBED — implemented here (no external PBReactUI import)
   ------------------------------------------------------------------ */

/**
 * PowerBIEmbed
 * Props:
 *  - reportData: { filters: [], meta: { project, manual_cost, automation_cost } }
 *  - embedUrl (optional): full Power BI embed URL (can include groupId, reportId)
 *  - reportId (optional): report GUID; required for SDK embed mode
 *  - accessToken (optional): Power BI embed token; required for SDK embed mode
 *
 * Behavior:
 *  - If the Power BI JS SDK ("powerbi-client") is available AND accessToken
 *    is provided, embed via SDK and apply filters using updateFilters().
 *  - Otherwise, fall back to a plain <iframe> (will render the report but filters
 *    cannot be injected without SDK).
 */
function PowerBIEmbed({
  reportData,
  embedUrl,
  reportId,
  accessToken,
}) {
  const containerRef = useRef(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState('');

  // Try to dynamically import the SDK once
  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        // Try to load the SDK (must be installed: npm i powerbi-client)
        const pbi = await import('powerbi-client');
        if (!gone) {
          // Cache module on window so we can use it everywhere
          window.__pbi__ = pbi;
          setSdkLoaded(true);
        }
      } catch (e) {
        if (!gone) {
          setSdkLoaded(false);
          setSdkError('powerbi-client not available; falling back to iframe.');
        }
      }
    })();
    return () => { gone = true; };
  }, []);

  // Embed or re-embed when data changes
  useEffect(() => {
    const pbi = window.__pbi__;
    // Only attempt SDK mode if we have all three: SDK, token, reportId
    if (!sdkLoaded || !pbi || !accessToken || !reportId || !containerRef.current) return;

    const { service, factories, models } = pbi;
    const svc = new service.Service(
      factories.hpmFactory,
      factories.wpmpFactory,
      factories.routerFactory
    );

    // Clean any existing embed in the container
    svc.reset(containerRef.current);

    const config = {
      type: 'report',
      id: reportId,
      embedUrl: embedUrl,
      accessToken: accessToken,
      tokenType: models.TokenType.Embed, // adjust if you use Aad token
      settings: {
        panes: { filters: { visible: false }, pageNavigation: { visible: false } },
        background: models.BackgroundType.Transparent,
      },
    };

    const report = svc.embed(containerRef.current, config);

    // Apply filters after the report loads
    report.on('loaded', async () => {
      try {
        if (Array.isArray(reportData?.filters) && reportData.filters.length) {
          await report.updateFilters(models.FiltersOperations.Replace, reportData.filters);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Power BI filter update failed:', e);
      }
    });

    // Dispose on unmount
    return () => {
      try { report.off('loaded'); } catch {}
      try { svc.reset(containerRef.current); } catch {}
    };
  }, [sdkLoaded, reportData, embedUrl, reportId, accessToken]);

  // Fallback: iframe (no SDK)
  if (!sdkLoaded || !accessToken || !reportId) {
    return (
      <div>
        {!!sdkError && (
          <div style={{ color: '#6b7280', marginBottom: 6, fontSize: '.9rem' }}>
            {sdkError}
          </div>
        )}
        <iframe
          title="PowerBI Report"
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoAuth=true`}
          style={{ width: '100%', height: 560, border: 0, borderRadius: 12 }}
          allowFullScreen
        />
      </div>
    );
  }

  // SDK container
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 560, borderRadius: 12, overflow: 'hidden', background: '#fff' }}
    />
  );
}

/* ------------------------------------------------------------------
   PROJECT QE VIEW — fetch costs, build filters, render PowerBIEmbed
   ------------------------------------------------------------------ */

const PBI_EMBED_URL =
  process.env.REACT_APP_PBI_EMBED_URL ||
  'https://app.powerbi.com/reportEmbed?reportId=c09b8d62-ab84-41a0-b507-16e7503527db&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true';
const PBI_REPORT_ID = process.env.REACT_APP_PBI_REPORT_ID || 'YOUR_REPORT_ID';
const PBI_ACCESS_TOKEN = process.env.REACT_APP_PBI_ACCESS_TOKEN || ''; // supply a valid embed token

export default function ProjectQE({ project }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [reportData, setReportData] = useState(null);

  const label = useMemo(() => {
    return project ? `${project.intake_number} — ${project.intake_name}` : '';
  }, [project]);

  useEffect(() => {
    let abort = false;
    setErr('');
    setReportData(null);

    if (!project?.intake_number || !project?.intake_name) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // STEP 1: fetch the project row (existing endpoint; logic unchanged)
        const url = `http://localhost:5000/api/projects/search?query=${encodeURIComponent(
          String(project.intake_number)
        )}&limit=20`;
        const res = await fetch(url);
        const list = await res.json();

        // Find exact project (match both intake_number and intake_name)
        const found =
          Array.isArray(list) &&
          list.find(
            (p) =>
              String(p.intake_number) === String(project.intake_number) &&
              String(p.intake_name) === String(project.intake_name)
          );

        if (!found) throw new Error('Project not found in search results.');

        const manual_cost =
          found.manual_cost != null ? Number(found.manual_cost) : undefined;
        const automation_cost =
          found.automation_cost != null ? Number(found.automation_cost) : undefined;

        if (
          typeof manual_cost !== 'number' ||
          Number.isNaN(manual_cost) ||
          typeof automation_cost !== 'number' ||
          Number.isNaN(automation_cost)
        ) {
          throw new Error('manual_cost or automation_cost not available for this project.');
        }

        // STEP 2: get a server-shaped Power BI filter payload for these values
        const fUrl = `http://localhost:5000/api/powerbi/filters?manual_cost=${encodeURIComponent(
          manual_cost
        )}&automation_cost=${encodeURIComponent(automation_cost)}`;
        const fres = await fetch(fUrl);
        const fjson = await fres.json();
        if (!fres.ok || !Array.isArray(fjson?.filters)) {
          throw new Error('Failed to build Power BI filters on the server.');
        }

        if (abort) return;

        setReportData({
          filters: fjson.filters,
          meta: { project: label, manual_cost, automation_cost },
        });
      } catch (e) {
        if (!abort) setErr(e.message || 'Failed to load report data.');
      } finally {
        if (!abort) setLoading(false);
      }
    };

    fetchData();
    return () => {
      abort = true;
    };
  }, [project, label]);

  if (!project) {
    return <div className="muted">Select a project to view QE dashboard.</div>;
  }

  if (loading) {
    return <div>Loading Project QE view for <b>{label}</b>…</div>;
  }

  if (err) {
    return (
      <div style={{ color: '#b91c1c' }}>
        Error loading Project QE data: {err}
      </div>
    );
  }

  return (
    <div>
      <div className="muted" style={{ marginBottom: 8 }}>
        Dynamic data for <b>{label}</b> — manual_cost: <b>{reportData?.meta?.manual_cost}</b>, automation_cost:{' '}
        <b>{reportData?.meta?.automation_cost}</b>
      </div>

      {/* EMBED REPORT — filters are applied post-load via SDK if available */}
      <PowerBIEmbed
        reportData={reportData}
        embedUrl={PBI_EMBED_URL}
        reportId={PBI_REPORT_ID}
        accessToken={PBI_ACCESS_TOKEN}
      />
    </div>
  );
}


