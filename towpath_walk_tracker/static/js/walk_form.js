/* global L */
const __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
	if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter');
	if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver)) throw new TypeError('Cannot read private member from an object whose class did not declare it');
	return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver);
};
let _WalkForm_instances, _WalkForm_setupEnableCtrl;
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
		return this;
	}

	show () {
		this.element.classList.remove('d-none');
		return this;
	}

	setEnableValue (value) {
		this.pointEnabled.value = value.toString();
		this.pointEnabled.dispatchEvent(new Event('change'));
		return this;
	}

	isEnabled () {
		return parseInt(this.pointEnabled.value);
	}

	enable () {
		this.setEnableValue(1);
		return this;
	}

	disable () {
		this.setEnableValue(0);
		this.setLatLng(null, null);
		return this;
	}

	getLatLng () {
		return [parseFloat(this.pointLatitude.value), parseFloat(this.pointLongitude.value)];
	}

	setLatLng (lat, lng) {
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
	constructor (element) {
		_WalkForm_instances.add(this);
		this.element = element;
		this.rows = Array.from(element.querySelectorAll('tr')).map((e) => new WalkFormPoint(e));
		__classPrivateFieldGet(this, _WalkForm_instances, 'm', _WalkForm_setupEnableCtrl).call(this);
	}

	setupButtons () {
		const theForm = this; // eslint-disable-line @typescript-eslint/no-this-alias
		function pointRowForButton (button) {
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
				const pointIndex = parseInt(root.dataset.pointIndex);
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
				const pointIndex = parseInt(root.dataset.pointIndex);
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

	populatePointsTable (coordinates) {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i].lat, coordinates[i].lng);
			this.rows[i].enable();
		}
		for (let i = coordinates.length; i < 50; i++) {
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

	reorder () {
		const coordinates = this.getCoordinates();
		console.log(coordinates);
		this.populatePointsTable(coordinates);
		console.log('Emit event');
		this.element.dispatchEvent(walkPointsChangedEvent);
	}

	getLastEnabledRowIdx () {
		const query = this.element.querySelector('tbody tr:nth-last-child(1 of :not(.d-none))');
		let lastEnabledRow = -1;
		if (query !== null) { lastEnabledRow = parseInt(query.dataset.pointIndex); }
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
				pointRow.disable();
				break;
			}
		}
	}

	replaceAllPoints (coordinates) {
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
_WalkForm_instances = new WeakSet(), _WalkForm_setupEnableCtrl = function _WalkForm_setupEnableCtrl () {
	const pointEnabledInputs = this.element.getElementsByClassName('point-enabled');
	// @ts-expect-error  // forEach  // TODO
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
};
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
