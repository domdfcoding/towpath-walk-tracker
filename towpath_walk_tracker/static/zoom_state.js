function updateQueryStringParam (key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value); // Add or update the parameter
  // window.history.pushState({}, null, url);
  window.history.replaceState({}, '', url);
}

// eslint-disable-next-line
function setupZoomState (map) {
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

// eslint-disable-next-line
function zoomStateFromURL (map) {
  const url = new URL(window.location.href);

  let zoomLvl = map.getZoom();
  if (url.searchParams.has('zoom')) {
    zoomLvl = url.searchParams.get('zoom');
  }

  const centre = map.getCenter();
  if (url.searchParams.has('lat')) {
    centre.lat = url.searchParams.get('lat');
  }
  if (url.searchParams.has('lng')) {
    centre.lng = url.searchParams.get('lng');
  }

  map.setView(centre, zoomLvl);
}
