import * as bootstrap from 'bootstrap';

declare let map_canal_towpath_walking: L.Map; // eslint-disable-line camelcase
declare let geo_json_watercourses: L.GeoJSON; // eslint-disable-line camelcase
declare let bsLoadingModal: bootstrap.Modal;
declare let sidebarAddButton: HTMLUListElement;

function watercoursesZoomOnClick (feature, layer) {
	layer.on({
		click: function (e) {
			if (typeof e.target.getBounds === 'function') {
				map_canal_towpath_walking.fitBounds(e.target.getBounds()); // eslint-disable-line camelcase
			} else if (typeof e.target.getLatLng === 'function') {
				let zoom = map_canal_towpath_walking.getZoom(); // eslint-disable-line camelcase
				zoom = zoom > 12 ? zoom : zoom + 1;
				map_canal_towpath_walking.flyTo(e.target.getLatLng(), zoom); // eslint-disable-line camelcase
			}
		}
	});
}

function addWatercoursesGeoJson (data) {
	map_canal_towpath_walking.removeLayer(geo_json_watercourses); // eslint-disable-line camelcase
	geo_json_watercourses.addData(data); // eslint-disable-line camelcase
	map_canal_towpath_walking.addLayer(geo_json_watercourses); // eslint-disable-line camelcase
	bsLoadingModal.hide();
	sidebarAddButton.classList.remove('disabled');
}

// @ts-expect-error  // Exporting to "window" global namespace
window.watercoursesZoomOnClick = watercoursesZoomOnClick;

// @ts-expect-error  // Exporting to "window" global namespace
window.addWatercoursesGeoJson = addWatercoursesGeoJson;
