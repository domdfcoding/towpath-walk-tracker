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
const walkPointsRows = document.querySelectorAll('table.walk-points tr');

walkPointsRows.forEach((pointRow) => {
	pointRow.pointLatitude = pointRow.getElementsByClassName('point-latitude')[0];
	pointRow.pointLongitude = pointRow.getElementsByClassName('point-longitude')[0];
	pointRow.pointEnabled = pointRow.getElementsByClassName('point-enabled')[0];
	pointRow.enable = function () {
		setEnableValue(this.pointEnabled, 1);
		return this;
	};
	pointRow.disable = function () {
		setEnableValue(this.pointEnabled, 0);
		this.setLatLng('', '');
		return this;
	};
	pointRow.getLatLng = function () { return [this.pointLatitude.value, this.pointLongitude.value]; };
	pointRow.setLatLng = function (lat, lng) {
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
});

pointEnabledInputs.forEach((enableCtrl) => {
	togglePointDisplay(enableCtrl);
	enableCtrl.addEventListener('change', (event) => {
		togglePointDisplay(event.target);
	});
});

pointDeleteButtons.forEach((deleteBtn) => {
	deleteBtn.addEventListener('click', () => {
		deleteBtn.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.disable();
		reorder();
	});
});

pointMoveUpButtons.forEach((moveBtn) => {
	moveBtn.addEventListener('click', () => {
		const root = moveBtn.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
		if (root.dataset.pointIndex === '0') {
			return;
		}

		console.log('Move from ' + root.dataset.pointIndex + ' to ' + (root.dataset.pointIndex - 1));
		movePoint(root.dataset.pointIndex, root.dataset.pointIndex - 1);
	});
});

pointMoveDownButtons.forEach((moveBtn) => {
	moveBtn.addEventListener('click', () => {
		const root = moveBtn.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
		const lastEnabledRow = document.querySelector('table.walk-points tbody tr:nth-last-child(1 of :not(.d-none))').dataset.pointIndex;
		if (root.dataset.pointIndex === lastEnabledRow) {
			return;
		}

		console.log('Move from ' + root.dataset.pointIndex + ' to ' + (root.dataset.pointIndex + 1));
		movePoint(root.dataset.pointIndex, (root.dataset.pointIndex * 1) + 1);
	});
});

function togglePointDisplay (enableCtrl) {
	const pointRow = enableCtrl.parentElement.parentElement.parentElement.parentElement.parentElement;
	if (enableCtrl.value === '1') {
		pointRow.pointLatitude.setAttribute('required', '');
		pointRow.pointLongitude.setAttribute('required', '');
		pointRow.classList.remove('d-none');
	} else {
		pointRow.pointLatitude.removeAttribute('required');
		pointRow.pointLongitude.removeAttribute('required');
		pointRow.classList.add('d-none');
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

function addPoint (lat, lng) { // eslint-disable-line @typescript-eslint/no-unused-vars
	const query = document.querySelector('table.walk-points tbody tr:nth-last-child(1 of :not(.d-none))');
	let lastEnabledRow = -1;
	if (query !== null) lastEnabledRow = query.dataset.pointIndex;
	const pointRow = walkPointsRows[1 + (lastEnabledRow * 1)];
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
