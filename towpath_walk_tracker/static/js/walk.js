/* global L */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LeafletWalkPreview {
	constructor (walkForm) {
		this.placedMarkerCount = 0;
		this.placedMarkers = [];
		this.polyLineWalk = null;
		this.walkForm = walkForm;
	}

	clearMarkers () {
		for (const m of this.placedMarkers) { m.remove(); }
		this.placedMarkers = [];
		this.placedMarkerCount = 0;
	}

	refresh (propagate = true) {
		const currentWalkLayer = feature_group_current_walk; // eslint-disable-line camelcase
		const placedMarkerLatLng = this.walkForm.getCoordinates();
		if (propagate) { this.walkForm.replaceAllPoints(placedMarkerLatLng); }
		if (placedMarkerLatLng.length >= 2) {
			fetch('/get-route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(placedMarkerLatLng)
			})
				.then(res => res.json())
				.then((coords) => {
					const lineColour = '#ff0000';
					currentWalkLayer.clearLayers();
					this.polyLineWalk = L.polyline(coords, { interactive: false, bubblingMouseEvents: true, color: lineColour, dashArray: null, dashOffset: null, fill: false, fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
						// ).addTo({{this._parent.get_name()}});
					).addTo(currentWalkLayer);
					// Arrows along route
					L.polylineDecorator(this.polyLineWalk, {
						patterns: [
							{ offset: '8%', repeat: '10%', symbol: L.Symbol.arrowHead({ pixelSize: 12, pathOptions: { stroke: true, fillOpacity: 1, color: lineColour, fill: true, fillColor: lineColour } }) }
						]
					}).addTo(currentWalkLayer);
					// Hammerhead at either end
					const hammerHead = L.Symbol.arrowHead({ pixelSize: 20, headAngle: 180, polygon: false, pathOptions: { stroke: true, color: lineColour } });
					L.polylineDecorator(this.polyLineWalk, { patterns: [{ symbol: hammerHead }] }).addTo(currentWalkLayer);
					L.polylineDecorator(this.polyLineWalk, { patterns: [{ offset: '100%', symbol: hammerHead }] }).addTo(currentWalkLayer);
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
		const walkMarkersLayer = feature_group_walk_markers; // eslint-disable-line camelcase
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
		const map = map_canal_towpath_walking; // eslint-disable-line camelcase
		const watercourses = geo_json_watercourses; // eslint-disable-line camelcase
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
