import React, { useEffect, useState } from 'react';
import { models, Embed } from 'powerbi-client';

function PowerBIEmbed({ reportData }) {
  // You can make embedUrl dynamic if needed
  const embedUrl = '<iframe title="ALM DSR" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=c09b8d62-ab84-41a0-b507-16e7503527db&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true" frameborder="0" allowFullScreen="true"></iframe>';

  return (
    <div style={{ width: '100%', height: '700px', textAlign: 'center' }}>
      <iframe
        title="PowerBI Report"
        width="100%"
        height="700"
        src={embedUrl}
        frameBorder="0"
        allowFullScreen={true}
      />
    </div>
  );
}

export default PowerBIEmbed;


  /*
  function PowerBIEmbed({ reportData }) {
  const [report, setReport] = useState(null);

  const embedConfig = {
    type: 'report',
    id: 'c09b8d62-ab84-41a0-b507-16e7503527db',
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=c09b8d62-ab84-41a0-b507-16e7503527db&autoAuth=true&ctid=222fcaf7-15d0-455f-97e1-8fda2eaad539&actionBarEnabled=true&reportCopilotInEmbed=true" frameborder="0" allowFullScreen="true',
    accessToken: '',
    tokenType: models.TokenType.Embed,
    settings: { filterPaneEnabled: false, navContentPaneEnabled: false }
  };



  useEffect(() => {
    // When reportData changes, update PowerBI filters
    if (report && reportData && reportData.length > 0) {
      // For demonstration, filters for Folder and TotalTestCases, Passed, etc.
      const Phasefilter = {
        $schema: "http://powerbi.com/product/schema#basic",
        target: { table: "ProgressBar", column: "Phase" },
        operator: "In",
        values: [reportData[0].Phasefilter]
      };const Completedfilter = {
        $schema: "http://powerbi.com/product/schema#basic",
        target: { table: "ProgressBar", column: "Completed" },
        operator: "In",
        values: [reportData[0].Completedfilter]
      };
      const InProgressfilter = {
        $schema: "http://powerbi.com/product/schema#basic",
        target: { table: "ProgressBar", column: "In_Progress" },
        operator: "In",
        values: [reportData[0].InProgressfilter]
      };
      const NotStartedfilter = {
        $schema: "http://powerbi.com/product/schema#basic",
        target: { table: "ProgressBar", column: "Not_Started" },
        operator: "In",
        values: [reportData[0].NotStartedfilter]
      };
      // need to add more filters here for more statuss
      report.updateFilters(models.FiltersOperations.Replace, [Phasefilter,Completedfilter, InProgressfilter,NotStartedfilter]);
    }
  }, [reportData, report]);


   if (!embedConfig || !embedConfig.embedUrl) {
    return <div>PowerBI configuration is missing.</div>;
  }

  return (
    <div>
      <Embed
        embedConfig={embedConfig}
        eventHandlers={{
          loaded: (event) => setReport(event.detail.report)
        }}
        cssClassName="report-style-class"
      />
    </div>
  );
}
*/

//export default PowerBIEmbed;