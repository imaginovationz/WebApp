// src/components/PBReactUI.js
import React, { useEffect, useState } from "react";

// QUICK MODE (keep working today with Publish-to-web iframe)
export default function PowerBIEmbed({ reportData }) {
  const embedUrl =
    "https://app.powerbi.com/reportEmbed?reportId=c09b8d62-ab84-41a0-b507-16e7503527db&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true";
  return (
    <div style={{ width: "100%", height: 700 }}>
      <iframe title="PowerBI Report" width="100%" height="700" src={embedUrl} frameBorder="0" allowFullScreen />
    </div>
  );
}

/*
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
DYNAMIC MODE (requires powerbi-client + valid Embed Token)
Uncomment & configure when ready.
(This mirrors your sample’s commented block.)
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

import { models, service, factories } from "powerbi-client";

export default function PowerBIEmbed({ reportData }) {
  const [report, setReport] = useState(null);

  const embedConfig = {
    type: "report",
    id: "<REPORT_ID>",
    embedUrl: "<EMBED_URL>",
    accessToken: "<EMBED_TOKEN>",
    tokenType: models.TokenType.Embed,
    settings: { filterPaneEnabled: false, navContentPaneEnabled: false },
  };

  useEffect(() => {
    const powerbi = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);
    const container = document.getElementById("pbi-container");
    if (!container) return;
    const r = powerbi.embed(container, embedConfig);
    setReport(r);
    return () => powerbi.reset(container);
  }, []);

  useEffect(() => {
    if (!report || !reportData?.length) return;
    // Example: build a filter from your ALM status counts
    const statuses = Object.keys(reportData[0].statuses || {});
    const filter = {
      $schema: "http://powerbi.com/product/schema#basic",
      target: { table: "YourTable", column: "Status" },
      operator: "In",
      values: statuses,
    };
    report.updateFilters(models.FiltersOperations.Replace, [filter]);
  }, [reportData, report]);

  return <div id="pbi-container" style={{ width: "100%", height: 700 }} />;
}
*/
