export function setupResizeObserver (map: L.Map) {
	// set up an observer that just logs the new width
	const observer = new ResizeObserver(entries => {
		const e = entries[0]; // should be only one
		console.log('Leaflet Map Size Changed');
		console.log(e.contentRect.height);
		console.log(e.contentRect.width);
		map.invalidateSize();
	});

	// start listening for size changes
	observer.observe(map.getContainer());
}
