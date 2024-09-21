import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function LineChart({ chartData }) {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    
    //disbaling animation
    animation: false, // disables all animations
    animations: {

      colors: false, // disables animation defined by the collection of 'colors' properties
      x: false, // disables animation defined by the 'x' property
    },
    transitions: {
      active: {
        animation: {
          // disables the animation for 'active' mode
          duration: 0
        }
      }
    },

    
    scales: {
      x: {
        position: 'top'
      }
    },
    plugins: {
      legend: {
        display: false
      },
    }
  };

  return (
    <div className=" min-h-64 w-full">
      {/* <h2 style={{ textAlign: "center" }}>Line Chart</h2> */}
      <Bar
        data={chartData}
        options={options}
      />
    </div>
  );
}
export default LineChart;