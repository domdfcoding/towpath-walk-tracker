/* global L */

Object.assign(HTMLCollection.prototype, {
	forEach (event) {
		Array.prototype.forEach.call(this, (element) => event(element));
	}
});

const walkPointsChangedEvent = new Event('changed');

const pointEnabledInputs = document.getElementsByClassName('point-enabled');
const pointDeleteButtons = document.getElementsByClassName('point-delete');
const pointMoveUpButtons = document.getElementsByClassName('point-move-up');
const pointMoveDownButtons = document.getElementsByClassName('point-move-down');

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

	enable () {
		setEnableValue(this.pointEnabled, 1);
		return this;
	};

	disable () {
		setEnableValue(this.pointEnabled, 0);
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

const walkPointsRows = Array.from(document.querySelectorAll('table.walk-points tr')).map((e) => new WalkFormPoint(e));

pointEnabledInputs.forEach((enableCtrl) => {
	togglePointDisplay(enableCtrl);
	enableCtrl.addEventListener('change', (event) => {
		togglePointDisplay(event.target);
	});
});

function pointRowForButton (button) {
	const pointRow = new WalkFormPoint(button.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement);
	return pointRow;
}

pointDeleteButtons.forEach((deleteBtn) => {
	deleteBtn.addEventListener('click', () => {
		const pointRow = pointRowForButton(deleteBtn);
		pointRow.disable();
		reorder();
	});
});

pointMoveUpButtons.forEach((moveBtn) => {
	moveBtn.addEventListener('click', () => {
		const root = pointRowForButton(moveBtn).element;
		const pointIndex = root.dataset.pointIndex;
		if (pointIndex === '0') {
			return;
		}

		console.log('Move from ' + pointIndex + ' to ' + (pointIndex - 1));
		movePoint(pointIndex, pointIndex - 1);
	});
});

pointMoveDownButtons.forEach((moveBtn) => {
	moveBtn.addEventListener('click', () => {
		const root = pointRowForButton(moveBtn).element;
		const pointIndex = root.dataset.pointIndex;
		if (pointIndex === getLastEnabledRowIdx()) {
			return;
		}

		console.log('Move from ' + pointIndex + ' to ' + (pointIndex + 1));
		movePoint(pointIndex, (pointIndex * 1) + 1);
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

function walkFormGetCoordinates () {
	const coordinates = [];

	walkPointsRows.forEach((pointRow) => {
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

function populatePointsTable (coordinates) {
	for (let i = 0; i < coordinates.length; i++) {
		walkPointsRows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
		walkPointsRows[i].enable();
	};

	for (let i = coordinates.length; i < 50; i++) {
		walkPointsRows[i].setLatLng('', '');
		walkPointsRows[i].disable();
	}
}

function movePoint (fromIdx, toIdx) {
	const coordinates = walkFormGetCoordinates();
	console.log(coordinates);

	const oldToValue = coordinates[toIdx];
	coordinates[toIdx] = coordinates[fromIdx];
	coordinates[fromIdx] = oldToValue;

	populatePointsTable(coordinates);

	console.log('Emit event');
	document.querySelector('table.walk-points').dispatchEvent(walkPointsChangedEvent);
}

function reorder () {
	const coordinates = walkFormGetCoordinates();
	console.log(coordinates);

	populatePointsTable(coordinates);

	console.log('Emit event');
	document.querySelector('table.walk-points').dispatchEvent(walkPointsChangedEvent);
}

function setEnableValue (enableCtrl, value) {
	enableCtrl.value = value;
	enableCtrl.dispatchEvent(new Event('change'));
}

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
		window.setTimeout(reorder, 0);
	});
});

function getLastEnabledRowIdx () {
	const query = document.querySelector('table.walk-points tbody tr:nth-last-child(1 of :not(.d-none))');
	let lastEnabledRow = -1;
	if (query !== null) lastEnabledRow = query.dataset.pointIndex;
	return lastEnabledRow;
}

function addPoint (lat, lng) { // eslint-disable-line @typescript-eslint/no-unused-vars
	const pointRow = walkPointsRows[1 + (getLastEnabledRowIdx() * 1)];
	pointRow.enable().setLatLng(lat, lng);
}

function removePointWithCoord (coord) { // eslint-disable-line @typescript-eslint/no-unused-vars
	for (const pointRow of walkPointsRows) {
		const latLng = L.latLng(pointRow.getLatLng());
		if (latLng.lat === coord.lat && latLng.lng === coord.lng) {
			pointRow.disable().setLatLng('', '');
			break;
		}
	}
}

function replaceAllPoints (coordinates) { // eslint-disable-line @typescript-eslint/no-unused-vars
	for (let i = 0; i < coordinates.length; i++) {
		walkPointsRows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
		walkPointsRows[i].enable();
	};

	for (let i = coordinates.length; i < 50; i++) {
		walkPointsRows[i].disable();
		walkPointsRows[i].setLatLng('', '');
	}

	document.getElementsByClassName('walk-points')[0].dispatchEvent(walkPointsChangedEvent);
}
