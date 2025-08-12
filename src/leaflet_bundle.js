/* global map_canal_towpath_walking, geo_json_watercourses, bsLoadingModal, sidebarAddButton */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import L from 'leaflet';
// Doesn't work. The npm package is in separate files
// and doesn't function the same as the dist version
// import "leaflet-sidebar";
import './leaflet-sidebar.min.js';
import 'leaflet-polylinedecorator';
import 'leaflet-geometryutil';

function watercoursesZoomOnClick (feature, layer) {
	layer.on({
		click: function (e) {
			if (typeof e.target.getBounds === 'function') {
				map_canal_towpath_walking.fitBounds(e.target.getBounds());
			} else if (typeof e.target.getLatLng === 'function') {
				let zoom = map_canal_towpath_walking.getZoom();
				zoom = zoom > 12 ? zoom : zoom + 1;
				map_canal_towpath_walking.flyTo(e.target.getLatLng(), zoom);
			}
		}
	});
}

function addWatercoursesGeoJson (data) {
	map_canal_towpath_walking.removeLayer(geo_json_watercourses);
	geo_json_watercourses.addData(data);
	map_canal_towpath_walking.addLayer(geo_json_watercourses);
	bsLoadingModal.hide();
	sidebarAddButton.classList.remove('disabled');
}

window.watercoursesZoomOnClick = watercoursesZoomOnClick;
window.addWatercoursesGeoJson = addWatercoursesGeoJson;
