import * as geojson from 'geojson';

declare let map_canal_towpath_walking: L.Map; // eslint-disable-line camelcase
declare let geo_json_watercourses: L.GeoJSON; // eslint-disable-line camelcase

declare class LeafletMapEvent {
	target : L.Map;
}

export function watercoursesZoomOnClick (feature: null, layer: L.Layer) {
	layer.on({
		click: function (e: LeafletMapEvent) {
			if (typeof e.target.getBounds === 'function') {
				map_canal_towpath_walking.fitBounds(e.target.getBounds()); // eslint-disable-line camelcase
			// @ts-expect-error  // Undefined
			} else if (typeof e.target.getLatLng === 'function') {
				let zoom = map_canal_towpath_walking.getZoom(); // eslint-disable-line camelcase
				zoom = zoom > 12 ? zoom : zoom + 1;
				// @ts-expect-error  // Undefined
				map_canal_towpath_walking.flyTo(e.target.getLatLng(), zoom); // eslint-disable-line camelcase
			}
		}
	});
}

export function addWatercoursesGeoJson (data: geojson.GeoJsonObject) {
	map_canal_towpath_walking.removeLayer(geo_json_watercourses); // eslint-disable-line camelcase
	geo_json_watercourses.addData(data); // eslint-disable-line camelcase
	map_canal_towpath_walking.addLayer(geo_json_watercourses); // eslint-disable-line camelcase
}
