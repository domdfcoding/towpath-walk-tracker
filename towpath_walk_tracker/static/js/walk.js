/* global L, feature_group_current_walk, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking, walkForm */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LeafletWalkPreview {
	constructor () {
		this.placedMarkerCount = 0;
		this.placedMarkers = [];
		this.polyLineWalk = null;
	}

	clearMarkers () {
		for (const m of this.placedMarkers) { m.remove(); }
		this.placedMarkers = [];
		this.placedMarkerCount = 0;
	}

	refresh (propagate = true) {
		// @ts-expect-error  // global varaiable
		const currentWalkLayer = feature_group_current_walk;
		const placedMarkerLatLng = walkForm.getCoordinates();
		if (propagate) { walkForm.replaceAllPoints(placedMarkerLatLng); }
		if (placedMarkerLatLng.length >= 2) {
			fetch('/get-route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(placedMarkerLatLng)
			})
				.then(res => res.json())
				.then((coords) => {
					currentWalkLayer.clearLayers();
					this.polyLineWalk = L.polyline(coords, { bubblingMouseEvents: true, color: '#ff0000', dashArray: null, dashOffset: null, fill: false, fillColor: '#ff0000', fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
						// ).addTo({{this._parent.get_name()}});
					).addTo(currentWalkLayer);
					console.log('Request complete! response:', coords);
				});
		} else {
			currentWalkLayer.clearLayers();
		}
	}

	addMarker (lat, lng) {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}
		const marker = L.marker([lat, lng], {});
		this.placedMarkers.push(marker);
		this.placedMarkerCount += 1;
		// @ts-expect-error  // global varaiable
		const walkMarkersLayer = feature_group_walk_markers;
		marker.addTo(walkMarkersLayer);
		marker.on('contextmenu', e => {
			walkForm.removePointWithCoord(e.target.getLatLng());
			this.removeMarker(e.target);
			this.refresh();
		});
	}

	removeMarker (marker) {
		this.placedMarkers = this.placedMarkers.filter(v => v !== marker);
		this.placedMarkerCount -= 1;
		marker.remove();
	}

	snapCoordToLine (lat, lng) {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}
		// @ts-expect-error  // global varaiable
		const map = map_canal_towpath_walking;
		// @ts-expect-error  // global varaiable
		const watercourses = geo_json_watercourses;
		// @ts-expect-error  // Doesn't think `feature` exists, but it does for layers of GeoJSON
		// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44293
		const coordinatesArray = watercourses.getLayers().map(l => l.feature.geometry.coordinates);
		const closestLatLng = L.GeometryUtil.closest(map, coordinatesArray, [lng, lat]);
		return L.latLng(closestLatLng.lng, closestLatLng.lat);
	}

	syncFromForm () {
		const coordinates = walkForm.getCoordinates();
		for (const m of this.placedMarkers) {
			const pos = m.getLatLng();
			let foundMarker = false;
			for (const c of coordinates) {
				if (pos.lat === c.lat && pos.lng === c.lng) {
					foundMarker = true;
					break;
				}
			}
			if (!foundMarker) {
				this.removeMarker(m);
			}
		}
		// add missing markers
		for (const c of coordinates) {
			let foundCoord = false;
			for (const m of this.placedMarkers) {
				const pos = m.getLatLng();
				if (pos.lat === c.lat && pos.lng === c.lng) {
					foundCoord = true;
					break;
				}
			}
			if (!foundCoord) {
				this.addMarker(c.lat, c.lng);
			}
		}
		this.refresh(false);
	}
}
