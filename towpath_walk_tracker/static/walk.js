/* global L, feature_group_current_walk, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking, replaceAllPoints, walkFormGetCoordinates */

let placedMarkerCount = 0;// eslint-disable-line no-unused-vars
let placedMarkers = [];
let polyLineWalk = null;// eslint-disable-line no-unused-vars

function clearMarkers () { // eslint-disable-line no-unused-vars
  for (const m of placedMarkers) m.remove();
  placedMarkers = [];
  placedMarkerCount = 0;
}

function refreshWalkPreview (propagate = true) { // eslint-disable-line no-unused-vars
  const placedMarkerLatLng = [];
  for (const m of placedMarkers) {
    const pos = m.getLatLng();
    placedMarkerLatLng.push([pos.lat, pos.lng]);
  }

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
  const marker = L.marker([lng, lat], {});

  placedMarkers.push(marker);
  placedMarkerCount += 1;

  marker.addTo(feature_group_walk_markers);

  marker.on('contextmenu', e => {
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
  const coordinatesArray = geo_json_watercourses.getLayers().map(l => l.feature.geometry.coordinates);
  const closestLatLng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinatesArray, [lng, lat]);
  return closestLatLng;
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
        refreshWalkPreview(false);
      }
    }
  }
);
