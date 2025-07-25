/* global L, feature_group_walks, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking */

let placedMarkerCount = 0;// eslint-disable-line no-unused-vars
let placedMarkers = [];
let polyLineWalk = null;// eslint-disable-line no-unused-vars

function clearMarkers () {
  for (const m of placedMarkers) m.remove();
  placedMarkers = [];
  placedMarkerCount = 0;
}

function createWalk () { // eslint-disable-line no-unused-vars
  const placedMarkerLatLng = [];
  for (const m of placedMarkers) {
    const pos = m.getLatLng();
    placedMarkerLatLng.push([pos.lat, pos.lng]);
  }
  fetch('/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(placedMarkerLatLng)
  })
    .then(res => res.json())
    .then(coords => {
      polyLineWalk = L.polyline(coords, { bubblingMouseEvents: true, color: '#ff0000', dashArray: null, dashOffset: null, fill: false, fillColor: '#ff0000', fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
        // ).addTo({{this._parent.get_name()}});
      ).addTo(feature_group_walks);
      console.log('Request complete! response:', coords);
      clearMarkers();
    });
}

function addMarker (lat, lng) { // eslint-disable-line no-unused-vars
  const marker = L.marker([lng, lat], {});

  placedMarkers.push(marker);
  placedMarkerCount += 1;

  marker.addTo(feature_group_walk_markers);

  marker.on('contextmenu', e => {
    placedMarkers = placedMarkers.filter(v => v !== e.target);
    placedMarkerCount -= 1;
    e.target.remove();
  });
}

function snapCoordToLine (lat, lng) { // eslint-disable-line no-unused-vars
  const coordinatesArray = geo_json_watercourses.getLayers().map(l => l.feature.geometry.coordinates);
  const closestLatLng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinatesArray, [lng, lat]);
  return closestLatLng;
}
