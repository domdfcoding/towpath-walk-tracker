import * as L from 'leaflet';
import { LeafletEvent } from 'leaflet';
import { NullOrUndefinedOr } from './types';
import { WalkForm } from './walk_form';
import { checkForLatLngMistakes } from './util';

declare let map_canal_towpath_walking: L.Map; // eslint-disable-line camelcase
declare let geo_json_watercourses: L.GeoJSON; // eslint-disable-line camelcase
declare let feature_group_current_walk: L.FeatureGroup; // eslint-disable-line camelcase
declare let feature_group_walk_markers: L.FeatureGroup; // eslint-disable-line camelcase
declare let feature_group_walks: L.FeatureGroup; // eslint-disable-line camelcase

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LeafletWalkPreview {
	placedMarkerCount: number;
	// placedMarkers: L.Marker[];
	polyLineWalk: NullOrUndefinedOr<L.Polyline>;
	walkForm: NullOrUndefinedOr<WalkForm>;
	abortController: AbortController;

	// Callable to check whether the preview can be interacted with (add or remove points).
	is_active: () => boolean;

	constructor (walkForm: NullOrUndefinedOr<WalkForm>) {
		this.placedMarkerCount = 0;
		// this.placedMarkers = [];
		this.polyLineWalk = null;
		this.walkForm = walkForm;
		this.is_active = () => false;
		this.abortController = new AbortController();
	}

	clearMarkers (): void {
		// for (const m of this.placedMarkers) m.remove();
		for (const m of this.#getMarkers()) m.remove();
		// this.placedMarkers = [];
		this.placedMarkerCount = 0;
	}

	refresh (propagate = true): void {
		const currentWalkLayer: L.FeatureGroup = feature_group_current_walk; // eslint-disable-line camelcase

		const placedMarkerLatLng: Array<L.LatLng> = this.walkForm!.getCoordinates();

		if (propagate) this.walkForm!.replaceAllPoints(placedMarkerLatLng);

		if (placedMarkerLatLng.length >= 2) {
			// Abort outstanding requests
			this.abortController.abort();
			this.abortController = new AbortController();

			fetch('/get-route/', {
				signal: this.abortController.signal,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(placedMarkerLatLng)
			})
				.then(res => res.json())
				.then((coords: Array<L.LatLng>) => {
					currentWalkLayer.clearLayers();
					this.polyLineWalk = drawWalk(coords, currentWalkLayer, '#ff0000', false);
					console.log('Request complete! response:', coords);
				}).catch(function (error) {
					if (error instanceof DOMException && error.name === 'AbortError') {
						console.info('Aborted incomplete route calculation.');
					} else {
						console.error('Fetch error:', error);
					}
				});
		} else {
			currentWalkLayer.clearLayers();
		}
	}

	addMarker (lat: number, lng: number, num: number = -1): void {
		lat = checkForLatLngMistakes(lat);
		lng = checkForLatLngMistakes(lng);

		let markerOptions: L.MarkerOptions = {};
		if (num > -1) {
			const customMarker = L.AwesomeMarkers.icon({
				icon: num.toString(),
				markerColor: 'blue',
				// @ts-expect-error  // Doesn't like `prefix` being custom.
				prefix: 'num'
			});

			markerOptions = { icon: customMarker };
		}
		const marker: L.Marker = L.marker([lat, lng], markerOptions);

		// this.placedMarkers.push(marker);
		this.placedMarkerCount += 1;

		marker.addTo(feature_group_walk_markers);

		marker.on('contextmenu', (e: LeafletEvent) => {
			if (!this.is_active()) { return; }
			this.walkForm!.removePointWithCoord(e.target.getLatLng());
			this.removeMarker(e.target);
			this.refresh();
		});
	}

	removeMarker (marker: L.Marker): void {
		console.log('Remove marker', marker);
		// this.placedMarkers = this.placedMarkers.filter(v => v !== marker);
		this.placedMarkerCount -= 1;
		marker.remove();
	}

	snapCoordToLine (lat: number, lng: number): L.LatLng {
		lat = checkForLatLngMistakes(lat);
		lng = checkForLatLngMistakes(lng);

		const watercourses: L.GeoJSON = geo_json_watercourses; // eslint-disable-line camelcase

		// @ts-expect-error  // Doesn't think `feature` exists, but it does for layers of GeoJSON
		// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44293
		const coordinatesArray = watercourses.getLayers().map(l => l.feature.geometry.coordinates);
		const closestLatLng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinatesArray, [lng, lat])!;
		return L.latLng(closestLatLng.lng, closestLatLng.lat);
	}

	#getMarkers (): L.Marker[] {
		// @ts-expect-error // Cast
		return feature_group_walk_markers.getLayers(); // eslint-disable-line camelcase
	}

	syncFromForm (): void {
		const coordinates: Array<L.LatLng> = this.walkForm!.getCoordinates();

		this.clearMarkers();

		// add markers with correct index number
		let markerIdx = 0;
		for (const c of coordinates) {
			markerIdx += 1;
			const foundCoord: boolean = false;
			// for (const m of this.#getMarkers()) {
			// 	const pos = m.getLatLng();
			// 	if (pos.lat === c.lat && pos.lng === c.lng) {
			// 		foundCoord = true;
			// 		break;
			// 	}
			// }

			if (!foundCoord) {
				this.addMarker(c.lat, c.lng, markerIdx);
			}
		}

		this.refresh(false);
	}

	placeMarkerOnMap (latlng: L.LatLng) {
		if (!this.is_active()) { return; }

		const closestLatLng = this.snapCoordToLine(latlng.lat, latlng.lng);
		const distance = L.GeometryUtil.distance(map_canal_towpath_walking, latlng, closestLatLng);
		console.log('Distance from click to point is', distance);

		if (distance <= 20) {
			this.addMarker(closestLatLng.lat, closestLatLng.lng, this.placedMarkerCount + 1);
			this.walkForm!.addPoint(closestLatLng);
			this.refresh(false);
		}
	}
}

export function drawWalk (
	coords: L.LatLngExpression[],
	layerGroup: L.LayerGroup,
	lineColour: string,
	interactive: boolean = true
): L.Polyline {
	// Line itself
	const walkPolyLine = L.polyline(
		coords,
		{ interactive, bubblingMouseEvents: true, color: lineColour, fill: false, fillOpacity: 0.2, fillRule: 'evenodd', lineCap: 'round', lineJoin: 'round', noClip: false, opacity: 1.0, smoothFactor: 1.0, stroke: true, weight: 3 }
	).addTo(layerGroup);

	// Arrows along route
	// TODO: hide arrows below zoom=8
	L.polylineDecorator(walkPolyLine, {
		patterns: [
			// { offset: '10%', repeat: '20%',
			{ offset: '10%', repeat: '100px', symbol: L.Symbol.arrowHead({ pixelSize: 12, pathOptions: { stroke: true, fillOpacity: 1, color: lineColour, fill: true, fillColor: lineColour } }) }
		]
	}).addTo(layerGroup);

	// Hammerhead at either end
	const hammerHead = L.Symbol.arrowHead({ pixelSize: 15, headAngle: 180, polygon: false, pathOptions: { stroke: true, color: lineColour } });
	L.polylineDecorator(walkPolyLine, { patterns: [{ repeat: 0, symbol: hammerHead }] }).addTo(layerGroup);
	L.polylineDecorator(walkPolyLine, { patterns: [{ repeat: 0, offset: '100%', symbol: hammerHead }] }).addTo(layerGroup);

	return walkPolyLine;
}

interface WalkDictionary {
	id: number;
	title: string;
	notes: string;
	start: string;
	duration: number;
}

function makePreviousWalkTooltip (walk: WalkDictionary) {
	const walkTooltip: HTMLDivElement = L.DomUtil.create('div');

	const walkDurationHour = Math.floor(walk.duration / 60); // .toString().padStart(2, '0');
	const walkDurationMins = (walk.duration % 60); // .toString().padStart(2, '0');

	const table = `<table>
	<tr><th>${walk.title}</th><tr>
	<tr><td>${walk.notes}</td></tr>
	<tr><td>${walk.start}</td></tr>
	<tr><td>${walkDurationHour}h ${walkDurationMins}m</td></tr>
	</table>`;

	walkTooltip.innerHTML = table;

	return walkTooltip;
}

export function drawPreviousWalks () {
	fetch('/all-walks/', { method: 'get' }).then(res => res.json())
		.then((walks) => {
			for (const walk of walks) {
				console.log(walk.title);
				const coords: L.LatLng[] = [];

				for (const node of walk.route) {
					coords.push(L.latLng(node.latitude!, node.longitude!));
				}

				console.log(coords);

				const walkPolyLine = drawWalk(coords, feature_group_walks, walk.colour);

				walkPolyLine.bindTooltip(
					makePreviousWalkTooltip(walk), {
					// @ts-expect-error // Doesn't like maxWidth
						maxWidth: 800,
						sticky: true,
						className: 'foliumtooltip'
					}
				);
			}
		});
}
