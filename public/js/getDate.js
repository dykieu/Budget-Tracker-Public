function getDate() {
	let mo = new Date().getMonth();
	let yr = new Date().getFullYear();

	return [mo + 1, yr];
}

module.exports = getDate;