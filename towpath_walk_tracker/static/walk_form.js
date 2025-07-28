/* global L */

Object.assign(HTMLCollection.prototype, {
	forEach (event) {
		Array.prototype.forEach.call(this, (element) => event(element));
	}
});

const walkPointsChangedEvent = new Event('changed');

class WalkFormPoint {
	constructor (element) {
		this.element = element;
		this.pointLatitude = this.element.getElementsByClassName('point-latitude')[0];
		this.pointLongitude = this.element.getElementsByClassName('point-longitude')[0];
		this.pointEnabled = this.element.getElementsByClassName('point-enabled')[0];
	}

	hide () {
		this.element.classList.add('d-none');
	}

	show () {
		this.element.classList.remove('d-none');
	}

	setEnableValue (value) {
		this.pointEnabled.value = value;
		this.pointEnabled.dispatchEvent(new Event('change'));
	}

	enable () {
		this.setEnableValue(1);
		return this;
	};

	disable () {
		this.setEnableValue(0);
		this.setLatLng('', '');
		return this;
	};

	getLatLng () { return [this.pointLatitude.value, this.pointLongitude.value]; };
	setLatLng (lat, lng) {
		// Check haven't tried to treat L.latLng as array or array as L.latLng
		if (lat === undefined) {
			throw ({ lat });
		}
		if (lng === undefined) {
			throw ({ lng });
		}

		this.pointLatitude.value = lat;
		this.pointLongitude.value = lng;
		return this;
	};
}

class WalkForm {
	constructor (element) {
		this.element = element;
		this.rows = Array.from(element.querySelectorAll('tr')).map((e) => new WalkFormPoint(e));
		this.#setupEnableCtrl();
	}

	#setupEnableCtrl () {
		const pointEnabledInputs = this.element.getElementsByClassName('point-enabled');

		pointEnabledInputs.forEach((enableCtrl) => {
			togglePointDisplay(enableCtrl);
			enableCtrl.addEventListener('change', (event) => {
				togglePointDisplay(event.target);
			});
		});

		function togglePointDisplay (enableCtrl) {
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

	setupButtons () {
		const theForm = this; // eslint-disable-line @typescript-eslint/no-this-alias

		function pointRowForButton (button) {
			const pointRow = new WalkFormPoint(button.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement);
			return pointRow;
		}

		const pointDeleteButtons = this.element.getElementsByClassName('point-delete');

		pointDeleteButtons.forEach((deleteBtn) => {
			deleteBtn.addEventListener('click', () => {
				const pointRow = pointRowForButton(deleteBtn);
				pointRow.disable();
				theForm.reorder();
			});
		});

		const pointMoveUpButtons = this.element.getElementsByClassName('point-move-up');

		pointMoveUpButtons.forEach((moveBtn) => {
			moveBtn.addEventListener('click', () => {
				const root = pointRowForButton(moveBtn).element;
				const pointIndex = root.dataset.pointIndex;
				if (pointIndex === '0') {
					return;
				}

				console.log('Move from ' + pointIndex + ' to ' + (pointIndex - 1));
				theForm.movePoint(pointIndex, pointIndex - 1);
			});
		});

		const pointMoveDownButtons = this.element.getElementsByClassName('point-move-down');

		pointMoveDownButtons.forEach((moveBtn) => {
			moveBtn.addEventListener('click', () => {
				const root = pointRowForButton(moveBtn).element;
				const pointIndex = root.dataset.pointIndex;
				if (pointIndex === theForm.getLastEnabledRowIdx()) {
					return;
				}

				console.log('Move from ' + pointIndex + ' to ' + (pointIndex + 1));
				theForm.movePoint(pointIndex, (pointIndex * 1) + 1);
			});
		});
	}

	getCoordinates () {
		const coordinates = [];

		this.rows.forEach((pointRow) => {
			if (pointRow.pointEnabled.value === '1') {
				const latLng = pointRow.getLatLng();
				if (latLng[0] !== '' || latLng[1] !== '') {
					coordinates.push(L.latLng(latLng));
				// coordinates.push(latLng);
				}
			}
		});

		return coordinates;
	}

	populatePointsTable (coordinates) {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
			this.rows[i].enable();
		};

		for (let i = coordinates.length; i < 50; i++) {
			this.rows[i].setLatLng('', '');
			this.rows[i].disable();
		}
	}

	movePoint (fromIdx, toIdx) {
		const coordinates = this.getCoordinates();
		console.log(coordinates);

		const oldToValue = coordinates[toIdx];
		coordinates[toIdx] = coordinates[fromIdx];
		coordinates[fromIdx] = oldToValue;

		this.populatePointsTable(coordinates);

		console.log('Emit event');
		this.element.dispatchEvent(walkPointsChangedEvent);
	}

	reorder () { // Really reindex, ensure index numbers go from 0 to <n points> with no gaps
		const coordinates = this.getCoordinates();
		console.log(coordinates);

		this.populatePointsTable(coordinates);

		console.log('Emit event');
		this.element.dispatchEvent(walkPointsChangedEvent);
	}

	getLastEnabledRowIdx () {
		const query = this.element.querySelector('tbody tr:nth-last-child(1 of :not(.d-none))');
		let lastEnabledRow = -1;
		if (query !== null) lastEnabledRow = query.dataset.pointIndex;
		return lastEnabledRow;
	}

	addPoint (lat, lng) {
		console.log(this.getLastEnabledRowIdx());
		const pointRow = this.rows[1 + (this.getLastEnabledRowIdx() * 1)];
		console.log(pointRow);
		pointRow.enable().setLatLng(lat, lng);
	}

	removePointWithCoord (coord) {
		for (const pointRow of this.rows) {
			const latLng = L.latLng(pointRow.getLatLng());
			if (latLng.lat === coord.lat && latLng.lng === coord.lng) {
				pointRow.disable().setLatLng('', '');
				break;
			}
		}
	}

	replaceAllPoints (coordinates) {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
			this.rows[i].enable();
		};

		for (let i = coordinates.length; i < 50; i++) {
			this.rows[i].disable();
			this.rows[i].setLatLng('', '');
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
			enabledCount += (pointRow.pointEnabled.value * 1);
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
		window.setTimeout(walkForm.reorder, 0);
	});
});
