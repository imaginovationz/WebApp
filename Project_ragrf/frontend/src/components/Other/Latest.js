import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Latest.css'; // For ticker styles


const Latest = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
      axios.get('/latestnews')
      .then(res => {
        setNews(res.data.latestnews || []);
      })
      .catch(err => {
        console.error("err",err);
        // setNews([{ headline: "AI to Generate Test cases.            Functional Tracker.            Integration with PowerBI.            ALM Report."}]);
        setNews([{ headline: "AI to Generate Test cases"}, { headline: "Functional Tracker" }, { headline: "Integration with PowerBI" }, { headline: "ALM Report" }]);

      });
  }, []);

  // Create a continuous string of all news headlines
  const createTickerText = () => {
    if (news.length === 0) return "";
    const headlines = news.map(item => item.headline).join("                              ");
    return headlines + "                              " + headlines;
  };

  return (
    <div className="ticker-container">
      <div className="ticker-wrapper">
        <span className="ticker-label">Latest in Automation: </span>
        <div className="ticker-content">
          <span className="ticker-text">{createTickerText()}</span>
        </div>
      </div>
    </div>
  );
};

export default Latest;