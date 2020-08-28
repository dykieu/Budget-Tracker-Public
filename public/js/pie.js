
document.addEventListener("DOMContentLoaded", (event) => {
  function wait_promise(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(ms);
      }, ms);
    });
  }

  async function makePie(data) {
    // Grabs element
    let myChart = document.getElementById('myChart').getContext('2d');
  
    // Global Styles
    Chart.defaults.global.defaultFontFamilt = 'Montserrat';
    Chart.defaults.global.defaultFontSize = 14;
  
    console.log(data);
    // Parsing JSON data
    let labels = [];
    let values = [];
    for (let i = 0; i < data.length; i++) {
      labels.push(data[i].catagory);
      values.push(data[i].totalspent.replace(/^.{2}/, ''));
    }
    await wait_promise(60);

    // Creates Chart
    let chartTemplate = new Chart(myChart, {
      type: 'pie', //bar, horizontalbar, pie, line, doughnut, radar, polarArea
      data: {
        // Chart labels
        labels: labels,
        // Chart data
        datasets: [{
          // Units
          label: 'Dollars',
          // Values
          data: values,
          // Chart color
          backgroundColor: [
            '#9b686b',
            '#c28285',
            '#f5c2c2',
            '#FFE8E5',
            '#E9BCb2'
          ],
          borderWidth: 1,
          borderColor: '#777',
        }]
      },
      // Chart options
      options: {
        responsive: true,
        legend: {
          position: 'right',
          labels: {
            fontColor: '#000'
          }
        },
        layout: {
          padding: {
            left: 0,
            right: 0,
            bottom: 10,
            top: 0
          }
        }
      }
    });
  }


  async function load_data() {
    let tblH = document.getElementById('pieDataHeader');
    let table = document.getElementById('pieData');
    let data = [];
    let header = [];

    // Header data
    for (let i = 0; i < tblH.rows[0].cells.length; i++) {
      header[i] = tblH.rows[0].cells[i].innerHTML.toLowerCase().replace(/ /gi, '');
    }
    await wait_promise(60);
    
    // Cell Data
    for (let i = 0; i < table.rows.length; i++) {
      let tblRow = table.rows[i];
      let rowData = {};

      // Add each column of each row into rowData
      for (let j = 0; j < tblRow.cells.length; j++) {
        rowData[header[j]] = tblRow.cells[j].innerHTML;
      }

      // Add each row into data
      data.push(rowData);
    }
    await wait_promise(60);
    makePie(data);
  }
  load_data();
});