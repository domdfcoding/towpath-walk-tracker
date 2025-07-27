/* global L, feature_group_current_walk, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking, replaceAllPoints, walkFormGetCoordinates, removePointWithCoord */

let placedMarkerCount = 0;// eslint-disable-line no-unused-vars
let placedMarkers = [];
let polyLineWalk = null;// eslint-disable-line no-unused-vars

function clearMarkers () { // eslint-disable-line no-unused-vars
  for (const m of placedMarkers) m.remove();
  placedMarkers = [];
  placedMarkerCount = 0;
}

function refreshWalkPreview (propagate = true) { // eslint-disable-line no-unused-vars
  const placedMarkerLatLng = walkFormGetCoordinates();

  if (propagate) replaceAllPoints(placedMarkerLatLng);

  if (placedMarkerLatLng.length >= 2) {
    fetch('/get-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placedMarkerLatLng)
    })
      .then(res => res.json())
      .then(coords => {
        feature_group_current_walk.clearLayers();
        polyLineWalk = L.polyline(coords, { bubblingMouseEvents: true, color: '#ff0000', dashArray: null, dashOffset: null, fill: false, fillColor: '#ff0000', fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
        // ).addTo({{this._parent.get_name()}});
        ).addTo(feature_group_current_walk);
        console.log('Request complete! response:', coords);
      });
  } else {
    feature_group_current_walk.clearLayers();
  }
}

function addMarker (lat, lng) { // eslint-disable-line no-unused-vars
  // Check haven't tried to treat L.latLng as array or array as L.latLng
  if (lat === undefined) {
    throw ({ lat: lat });
  }
  if (lng === undefined) {
    throw ({ lng: lng });
  }

  const marker = L.marker([lat, lng], {});

  placedMarkers.push(marker);
  placedMarkerCount += 1;

  marker.addTo(feature_group_walk_markers);

  marker.on('contextmenu', e => {
    removePointWithCoord(e.target.getLatLng());
    removeMarker(e.target);
    refreshWalkPreview();
  });
}

function removeMarker (marker) {
  placedMarkers = placedMarkers.filter(v => v !== marker);
  placedMarkerCount -= 1;
  marker.remove();
}

function snapCoordToLine (lat, lng) { // eslint-disable-line no-unused-vars
  // Check haven't tried to treat L.latLng as array or array as L.latLng
  if (lat === undefined) {
    throw ({ lat: lat });
  }
  if (lng === undefined) {
    throw ({ lng: lng });
  }

  const coordinatesArray = geo_json_watercourses.getLayers().map(l => l.feature.geometry.coordinates);
  const closestLatLng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinatesArray, [lng, lat]);
  return closestLatLng; // TODO: lat/lng are flipped from the dict labels
}

document.querySelector('table.walk-points').addEventListener('changed',
  (e) => {
    const coordinates = walkFormGetCoordinates();

    for (const m of placedMarkers) {
      const pos = m.getLatLng();
      let foundMarker = false;
      for (const c of coordinates) {
        if (pos.lat === c.lat && pos.lng === c.lng) {
          foundMarker = true;
          break;
        }
      }

      if (!foundMarker) {
        removeMarker(m);
      }
    }
    refreshWalkPreview(false);
  }
);
