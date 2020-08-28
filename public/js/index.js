'use strict';
console.log('JS connected');

function sortTable(order, column, tableR, table) {
	let rows = tableR.get();

	// ASC or DSC
	rows.sort(function(a, b) {
		let A = getVal(a);
		let B = getVal(b);

		if(A < B) {
			return -1 * order;
		}
		if(A > B) {
			return 1 * order;
		}
		return 0;
	});

	function getVal(elm) {
		let v = $(elm).children('td').eq(column).text().toUpperCase();
		if($.isNumeric(v)){
			v = parseInt(v, 10);
		}
		return v;
	}

	// Change table order
	$.each(rows, function(index, row) {
		table.children('tbody').append(row);
	});
}

$(document).ready(() => {
	let path = window.location.pathname;

	// If on add page
	if (path == '/add') {
		// Add Page Jquery
		// Initialize page forms
		$('.bankForm').css('display', 'none');
		$('.budgetForm').css('display', 'none');
		$('.depositForm').css('display', 'none');
		$('.spendingForm').css('display', 'none');
		$('#catagoryCard').css('display', 'none');
		$('#catagoryCardBank').css('display', 'none');
		
		// Check when user Changes option selection
		$('#entryType').change(() => {
			// Reset form on change
			$('.bankForm').css('display', 'none');
			$('.budgetForm').css('display', 'none');
			$('.depositForm').css('display', 'none');
			$('.spendingForm').css('display', 'none');
			$('#catagoryCard').css('display', 'none');
			$('#catagoryCardBank').css('display', 'none');

			let addSelector = $('#entryType').val();

			// If option is bank
			if ( addSelector == 'bank') {
				console.log('Add Bank Selected');
				$('.bankForm').css('display', 'block');
			} else if (addSelector == 'budget') {
				console.log('Add Budget Selected');
				$('.budgetForm').css('display', 'block');
				$('#catagoryCard').css('display', 'block');
				$('#catagoryCardBank').css('display', 'block');
			} else if (addSelector == 'deposit') {
				console.log('Add deposit Selected');
				$('.depositForm').css('display', 'block');
				$('#catagoryCardBank').css('display', 'block');
			} else if (addSelector == 'spending') {
				console.log('Add expenditure Selected');
				$('.spendingForm').css('display', 'block');
				$('#catagoryCard').css('display', 'block');
				$('#catagoryCardBank').css('display', 'block');
			}
		});
	} else if (path == '/logistics') {
		sortTable(-1, 2, $('#allLog tbody tr'), $('#allLog'));
		
		// Open up edit form
		$('.openForm').click((button) => {
			$('#depForm' + (button.target.id).substring(4,(button.target.id).length)).css('display', 'block');
			$('.splash').css('display', 'block');
		});
		
		$('.close').click((button) => {
			$('#depForm' + (button.target.id).substring(5,(button.target.id).length)).css('display', 'none');
			$('.splash').css('display', 'none');
		});
	}
});