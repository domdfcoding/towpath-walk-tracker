/* global L */

Object.assign(HTMLCollection.prototype, {
	forEach (event) {
		Array.prototype.forEach.call(this, (element) => event(element));
	}
});

const walkPointsChangedEvent = new Event('changed');

class WalkFormPoint {
	element: HTMLTableElement;
	pointLatitude: HTMLInputElement;
	pointLongitude: HTMLInputElement;
	pointEnabled: HTMLInputElement;

	constructor (element) {
		this.element = element;
		this.pointLatitude = this.element.getElementsByClassName('point-latitude')[0] as HTMLInputElement;
		this.pointLongitude = this.element.getElementsByClassName('point-longitude')[0] as HTMLInputElement;
		this.pointEnabled = this.element.getElementsByClassName('point-enabled')[0] as HTMLInputElement;
	}

	hide (): WalkFormPoint {
		this.element.classList.add('d-none');
		return this;
	}

	show (): WalkFormPoint {
		this.element.classList.remove('d-none');
		return this;
	}

	setEnableValue (value: number): WalkFormPoint {
		this.pointEnabled.value = value.toString();
		this.pointEnabled.dispatchEvent(new Event('change'));
		return this;
	}

	isEnabled (): number { // like boolean, 0=False, 1=True
		return parseInt(this.pointEnabled.value);
	}

	enable (): WalkFormPoint {
		this.setEnableValue(1);
		return this;
	}

	disable (): WalkFormPoint {
		this.setEnableValue(0);
		this.setLatLng(null, null);
		return this;
	}

	getLatLng (): LatLngArray {
		return [parseFloat(this.pointLatitude.value), parseFloat(this.pointLongitude.value)];
	}

	setLatLng (lat: NullOrUndefinedOr<number>, lng: NullOrUndefinedOr<number>): WalkFormPoint {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}

		// Clear values if null
		if (lat === null) {
			this.pointLatitude.value = '';
		} else {
			this.pointLatitude.value = lat.toString();
		}

		if (lng === null) {
			this.pointLongitude.value = '';
		} else {
			this.pointLongitude.value = lng.toString();
		}

		return this;
	}
}

class WalkForm {
	element: HTMLTableRowElement;
	rows: WalkFormPoint[];

	constructor (element) {
		this.element = element;
		this.rows = Array.from(element.querySelectorAll('tr')).map((e) => new WalkFormPoint(e));
		this.#setupEnableCtrl();
	}

	#setupEnableCtrl (): void {
		const pointEnabledInputs = this.element.getElementsByClassName('point-enabled');

		// @ts-expect-error  // forEach  // TODO
		pointEnabledInputs.forEach((enableCtrl) => {
			togglePointDisplay(enableCtrl);
			enableCtrl.addEventListener('change', (event) => {
				togglePointDisplay(event.target);
			});
		});

		function togglePointDisplay (enableCtrl): void {
			const pointRow = new WalkFormPoint(enableCtrl.parentElement.parentElement.parentElement.parentElement.parentElement);
			if (enableCtrl.value === '1') {
				pointRow.pointLatitude.setAttribute('required', '');
				pointRow.pointLongitude.setAttribute('required', '');
				pointRow.show();
			} else {
				pointRow.pointLatitude.removeAttribute('required');
				pointRow.pointLongitude.removeAttribute('required');
				pointRow.hide();
			}
		}
	}

	setupButtons (): void {
		const theForm = this; // eslint-disable-line @typescript-eslint/no-this-alias

		function pointRowForButton (button): WalkFormPoint {
			const pointRow = new WalkFormPoint(button.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement);
			return pointRow;
		}

		const pointDeleteButtons = this.element.getElementsByClassName('point-delete');

		// @ts-expect-error  // forEach  // TODO
		pointDeleteButtons.forEach((deleteBtn) => {
			deleteBtn.addEventListener('click', () => {
				const pointRow = pointRowForButton(deleteBtn);
				pointRow.disable();
				theForm.reorder();
			});
		});

		const pointMoveUpButtons = this.element.getElementsByClassName('point-move-up');

		// @ts-expect-error  // forEach  // TODO
		pointMoveUpButtons.forEach((moveBtn) => {
			moveBtn.addEventListener('click', () => {
				const root = pointRowForButton(moveBtn).element;
				const pointIndex: number = parseInt(root.dataset.pointIndex);
				if (pointIndex === 0) {
					return;
				}

				console.log('Move from ' + pointIndex + ' to ' + (pointIndex - 1));
				theForm.movePoint(pointIndex, pointIndex - 1);
			});
		});

		const pointMoveDownButtons = this.element.getElementsByClassName('point-move-down');

		// @ts-expect-error  // forEach  // TODO
		pointMoveDownButtons.forEach((moveBtn) => {
			moveBtn.addEventListener('click', () => {
				const root = pointRowForButton(moveBtn).element;
				const pointIndex: number = parseInt(root.dataset.pointIndex);
				if (pointIndex === theForm.getLastEnabledRowIdx()) {
					return;
				}

				console.log('Move from ' + pointIndex + ' to ' + (pointIndex + 1));
				theForm.movePoint(pointIndex, (pointIndex * 1) + 1);
			});
		});
	}

	getCoordinates (): L.LatLng[] {
		const coordinates = [];

		this.rows.forEach((pointRow) => {
			if (pointRow.isEnabled() === 1) {
				const latLng = pointRow.getLatLng();
				if (!isNaN(latLng[0]) || !isNaN(latLng[1])) {
					coordinates.push(L.latLng(latLng));
				// coordinates.push(latLng);
				}
			}
		});

		return coordinates;
	}

	populatePointsTable (coordinates: L.LatLng[]): void {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
			this.rows[i].enable();
		}

		for (let i = coordinates.length; i < 50; i++) {
			this.rows[i].disable();
		}
	}

	movePoint (fromIdx: number, toIdx: number): void {
		const coordinates = this.getCoordinates();
		console.log(coordinates);

		const oldToValue = coordinates[toIdx];
		coordinates[toIdx] = coordinates[fromIdx];
		coordinates[fromIdx] = oldToValue;

		this.populatePointsTable(coordinates);

		console.log('Emit event');
		this.element.dispatchEvent(walkPointsChangedEvent);
	}

	reorder (): void { // Really reindex, ensure index numbers go from 0 to <n points> with no gaps
		const coordinates = this.getCoordinates();
		console.log(coordinates);

		this.populatePointsTable(coordinates);

		console.log('Emit event');
		this.element.dispatchEvent(walkPointsChangedEvent);
	}

	getLastEnabledRowIdx (): number {
		const query: HTMLElement = this.element.querySelector('tbody tr:nth-last-child(1 of :not(.d-none))');
		let lastEnabledRow: number = -1;
		if (query !== null) lastEnabledRow = parseInt(query.dataset.pointIndex);
		return lastEnabledRow;
	}

	addPoint (lat: number, lng: number): void {
		console.log(this.getLastEnabledRowIdx());
		const pointRow = this.rows[1 + (this.getLastEnabledRowIdx() * 1)];
		console.log(pointRow);
		pointRow.enable().setLatLng(lat, lng);
	}

	removePointWithCoord (coord: L.LatLng): void {
		for (const pointRow of this.rows) {
			const latLng = L.latLng(pointRow.getLatLng());
			if (latLng.lat === coord.lat && latLng.lng === coord.lng) {
				pointRow.disable();
				break;
			}
		}
	}

	replaceAllPoints (coordinates: L.LatLng[]): void {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
			this.rows[i].enable();
		}

		for (let i = coordinates.length; i < 50; i++) {
			this.rows[i].disable();
		}

		this.element.dispatchEvent(walkPointsChangedEvent);
	}
}

const walkForm = new WalkForm(document.querySelector('table.walk-points'));
const walkPointsRows = walkForm.rows;
walkForm.setupButtons();

document.querySelectorAll('.needs-validation#walk-form').forEach(form => {
	form.addEventListener('submit', event => {
		let enabledCount = 0;
		walkPointsRows.forEach((pointRow) => {
			enabledCount += pointRow.isEnabled();
		});
		if (enabledCount < 2) {
			// TODO: show message
			console.log('Too few points!');
			event.preventDefault();
			event.stopPropagation();
		}
	});
});

document.querySelectorAll('.needs-validation#walk-form').forEach(form => {
	form.addEventListener('reset', () => {
		console.log('Form was reset');
		window.setTimeout(() => { walkForm.reorder(); }, 0);
	});
});
