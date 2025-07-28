/* global L, feature_group_current_walk, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking, replaceAllPoints, walkFormGetCoordinates, removePointWithCoord */

class LeafletWalkPreview {
	constructor () {
		this.placedMarkerCount = 0;
		this.placedMarkers = [];
		this.polyLineWalk = null;
	}

	clearMarkers () {
		for (const m of this.placedMarkers) m.remove();
		this.placedMarkers = [];
		this.placedMarkerCount = 0;
	}

	refresh (propagate = true) {
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
					this.polyLineWalk = L.polyline(coords, { bubblingMouseEvents: true, color: '#ff0000', dashArray: null, dashOffset: null, fill: false, fillColor: '#ff0000', fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
						// ).addTo({{this._parent.get_name()}});
					).addTo(feature_group_current_walk);
					console.log('Request complete! response:', coords);
				});
		} else {
			feature_group_current_walk.clearLayers();
		}
	}

	addMarker (lat, lng) {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat: lat });
		}
		if (lng === undefined) {
			throw ({ lng: lng });
		}

		const marker = L.marker([lat, lng], {});

		this.placedMarkers.push(marker);
		this.placedMarkerCount += 1;

		marker.addTo(feature_group_walk_markers);

		marker.on('contextmenu', e => {
			removePointWithCoord(e.target.getLatLng());
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
			throw ({ lat: lat });
		}
		if (lng === undefined) {
			throw ({ lng: lng });
		}

		const coordinatesArray = geo_json_watercourses.getLayers().map(l => l.feature.geometry.coordinates);
		const closestLatLng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinatesArray, [lng, lat]);
		return closestLatLng; // TODO: lat/lng are flipped from the dict labels
	}

	syncFromForm () {
		const coordinates = walkFormGetCoordinates();

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

const walkPreview = new LeafletWalkPreview();

document.querySelector('table.walk-points').addEventListener('changed',
	(e) => { walkPreview.syncFromForm(); }
);
