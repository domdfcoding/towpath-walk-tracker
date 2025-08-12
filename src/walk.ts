/* global L, feature_group_current_walk, feature_group_walk_markers, geo_json_watercourses, map_canal_towpath_walking, walkForm */

type NullOrUndefinedOr<T> = T extends void ? never : null | undefined | T;

interface LatLngArray extends Array<number> {
    length: 2;

    0: number;
    1: number;

}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LeafletWalkPreview {
	placedMarkerCount: number;
	placedMarkers: L.Marker[];
	polyLineWalk: NullOrUndefinedOr<L.Polyline>;

	constructor () {
		this.placedMarkerCount = 0;
		this.placedMarkers = [];
		this.polyLineWalk = null;
	}

	clearMarkers (): void {
		for (const m of this.placedMarkers) m.remove();
		this.placedMarkers = [];
		this.placedMarkerCount = 0;
	}

	refresh (propagate = true): void {
		// @ts-expect-error  // global varaiable
		const currentWalkLayer: L.FeatureGroup = feature_group_current_walk;

		const placedMarkerLatLng: Array<L.LatLng> = walkForm.getCoordinates();

		if (propagate) walkForm.replaceAllPoints(placedMarkerLatLng);

		if (placedMarkerLatLng.length >= 2) {
			fetch('/get-route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(placedMarkerLatLng)
			})
				.then(res => res.json())
				.then((coords: Array<LatLngArray>) => {
					const lineColour: string = '#ff0000';

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

	addMarker (lat: number, lng: number): void {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}

		const marker: L.Marker = L.marker([lat, lng], {});

		this.placedMarkers.push(marker);
		this.placedMarkerCount += 1;

		// @ts-expect-error  // global varaiable
		const walkMarkersLayer: L.FeatureGroup = feature_group_walk_markers;

		marker.addTo(walkMarkersLayer);

		marker.on('contextmenu', e => {
			walkForm.removePointWithCoord(e.target.getLatLng());
			this.removeMarker(e.target);
			this.refresh();
		});
	}

	removeMarker (marker): void {
		this.placedMarkers = this.placedMarkers.filter(v => v !== marker);
		this.placedMarkerCount -= 1;
		marker.remove();
	}

	snapCoordToLine (lat: number, lng: number): L.LatLng {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}

		// @ts-expect-error  // global varaiable
		const map: L.Map = map_canal_towpath_walking;

		// @ts-expect-error  // global varaiable
		const watercourses: L.GeoJSON = geo_json_watercourses;

		// @ts-expect-error  // Doesn't think `feature` exists, but it does for layers of GeoJSON
		// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44293
		const coordinatesArray = watercourses.getLayers().map(l => l.feature.geometry.coordinates);
		const closestLatLng = L.GeometryUtil.closest(map, coordinatesArray, [lng, lat]);
		return L.latLng(closestLatLng.lng, closestLatLng.lat);
	}

	syncFromForm (): void {
		const coordinates: Array<L.LatLng> = walkForm.getCoordinates();

		for (const m of this.placedMarkers) {
			const pos = m.getLatLng();
			let foundMarker: boolean = false;
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
			let foundCoord: boolean = false;
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
