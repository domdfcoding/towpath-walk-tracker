function updateQueryStringParam (key, value) {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value); // Add or update the parameter
	// window.history.pushState({}, null, url);
	window.history.replaceState({}, '', url);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setupZoomState (map: L.Map) {
	map.on('zoomend', function () {
		const zoomLvl = map.getZoom();
		updateQueryStringParam('zoom', zoomLvl);
	});

	map.on('moveend', function () {
		const centre = map.getCenter();
		updateQueryStringParam('lat', centre.lat);
		updateQueryStringParam('lng', centre.lng);
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function zoomStateFromURL (defaultZoom: number, defaultCentre: L.LatLng) {
	const url = new URL(window.location.href);

	// let zoomLvl = map.getZoom();
	let zoomLvl = defaultZoom;
	if (url.searchParams.has('zoom')) {
		zoomLvl = parseInt(url.searchParams.get('zoom'));
	}

	// const centre = map.getCenter();
	const centre = defaultCentre;
	if (url.searchParams.has('lat')) {
		centre.lat = parseFloat(url.searchParams.get('lat'));
	}
	if (url.searchParams.has('lng')) {
		centre.lng = parseFloat(url.searchParams.get('lng'));
	}

	return { centre, zoomLvl };
}
