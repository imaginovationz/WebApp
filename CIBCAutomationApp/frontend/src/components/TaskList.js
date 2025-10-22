import React, { useState } from "react";

const TaskList = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weeks, setWeeks] = useState([]);

  // Function to generate weeks based on date range
  const generateWeeks = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedWeeks = [];

    while (start <= end) {
      const weekStart = new Date(start);
      start.setDate(start.getDate() + 6);
      generatedWeeks.push(
        `${weekStart.toLocaleDateString()} - ${start.toLocaleDateString()}`
      );
      start.setDate(start.getDate() + 1); // Move to the next week
    }

    setWeeks(generatedWeeks);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Weekly Resource Allocations</h2>

      {/* Date range inputs */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Start Date:{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        &nbsp;&nbsp;
        <label>
          End Date:{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        &nbsp;&nbsp;
        <button onClick={generateWeeks}>Generate Weeks</button>
      </div>

      {/* Display weekly allocations */}
      {weeks.length > 0 && (
        <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {weeks.map((week, index) => (
                <th key={index}>{week}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weeks.map((_, index) => (
                <td key={index}>
                  <input
                    type="text"
                    placeholder={`Allocation for Week ${index + 1}`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TaskList;