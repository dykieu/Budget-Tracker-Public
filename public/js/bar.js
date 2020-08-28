
document.addEventListener('DOMContentLoaded', (event) => {
	function wait_promise(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
			resolve(ms);
			}, ms);
		});
	}
	
	async function makeBar(data) {
		// Grabs element
		let myBudget = document.getElementById('myBudget').getContext('2d');
	
		// Global Styles
		Chart.defaults.global.defaultFontFamilt = 'Montserrat';
		Chart.defaults.global.defaultFontSize = 14;
		console.log(data);
		
		// Parsing JSON data
		let labels = [];
		let values = [];
		let values2 = [];
		for (let i = 0; i < data.length; i++) {
		  labels.push(data[i].catagory);
		  values.push(data[i].totalspent.replace(/^.{2}/, ''));
		  values2.push(data[i].totalbudget.replace(/^.{2}/, ''));
		}
		await wait_promise(60);

		// Creates Chart
		let chartTemplate2 = new Chart(myBudget, {
		type: 'bar',
		data: {
			// Chart labels
			labels: labels,
			// Chart data
			datasets: [{
			// Units
			label: 'Spending',
			// Values
			data: values,
			// Chart color
			backgroundColor: '#c49598e5',
			borderWidth: 1,
			borderColor: '#777',
			order: 1,
			hoverBackgroundColor: '#c28285'
			}, {
			label: 'Budget',
			data: values2,
			backgroundColor: '#e7bcb2a8',
			borderWidth: 1,
			borderColor: '#777',
			order: 1,
			hoverBackgroundColor: '#E9BCb2'
			}]
		},
		// Chart options
		options: {
			// Stacks bars
			scales: {
			xAxes: [{stacked: true}],
			yAxes: [{
				stacked: false,
				ticks: {
				beginAtZero: true
				}
			}]
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
		makeBar(data);
	}
	
	load_data();
});