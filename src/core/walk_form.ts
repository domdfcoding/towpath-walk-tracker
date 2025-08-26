import * as L from 'leaflet';
import { NullOrUndefinedOr } from './types';
import { checkForLatLngMistakes } from './util';

Object.assign(HTMLCollection.prototype, {
	forEach (func: Function) { // eslint-disable-line @typescript-eslint/no-unsafe-function-type
		Array.prototype.forEach.call(this, (element: HTMLElement) => func(element));
	}
});

export const walkPointsChangedEvent = new Event('changed');

export class WalkFormPoint {
	element: HTMLTableRowElement;
	pointID: HTMLInputElement;
	pointLatitude: HTMLInputElement;
	pointLongitude: HTMLInputElement;
	pointEnabled: HTMLInputElement;

	constructor (element: HTMLTableRowElement) {
		this.element = element;
		this.pointID = this.element.getElementsByClassName('point-id')[0] as HTMLInputElement;
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
		this.setLatLng(null);
		return this;
	}

	getLatLng (): L.LatLng {
		return L.latLng(parseFloat(this.pointLatitude.value), parseFloat(this.pointLongitude.value), parseFloat(this.pointID.value));
	}

	setLatLng (latLng: NullOrUndefinedOr<L.LatLng>): WalkFormPoint {
		// Clear values if null
		if (latLng == null) { // Or undefined
			this.pointLatitude.value = '';
			this.pointLongitude.value = '';
			this.pointID.value = '';

			return this;
		}

		this.pointLatitude.value = checkForLatLngMistakes(latLng.lat).toString();
		this.pointLongitude.value = checkForLatLngMistakes(latLng.lng).toString();

		if (latLng.alt == null) { // Or undefined
			this.pointID.value = '';
		} else {
			this.pointID.value = latLng.alt.toString();
		}

		return this;
	}
}

export class WalkForm {
	element: HTMLTableRowElement;
	rows: WalkFormPoint[];

	constructor (element: HTMLTableRowElement) {
		this.element = element;
		this.rows = Array.from(element.querySelectorAll('tr')).map((e) => new WalkFormPoint(e));
		this.#setupEnableCtrl();
	}

	#setupEnableCtrl (): void {
		const pointEnabledInputs = this.element.getElementsByClassName('point-enabled');

		// @ts-expect-error  // forEach  // TODO
		pointEnabledInputs.forEach((enableCtrl) => {
			togglePointDisplay(enableCtrl);
			enableCtrl.addEventListener('change', (event: Event) => {
				togglePointDisplay(event.target! as HTMLInputElement);
			});
		});

		function togglePointDisplay (enableCtrl: HTMLInputElement): void {
			const pointRow = new WalkFormPoint(enableCtrl.parentElement!.parentElement!.parentElement!.parentElement!.parentElement as HTMLTableRowElement);
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

		function pointRowForButton (button: HTMLButtonElement): WalkFormPoint {
			const pointRow = new WalkFormPoint(button.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!.parentElement as HTMLTableRowElement);
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
				const pointIndex: number = parseInt(root.dataset.pointIndex as string);
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
				const pointIndex: number = parseInt(root.dataset.pointIndex as string);
				if (pointIndex === theForm.getLastEnabledRowIdx()) {
					return;
				}

				console.log('Move from ' + pointIndex + ' to ' + (pointIndex + 1));
				theForm.movePoint(pointIndex, (pointIndex * 1) + 1);
			});
		});
	}

	getCoordinates (): L.LatLng[] {
		const coordinates: L.LatLng[] = [];

		this.rows.forEach((pointRow) => {
			if (pointRow.isEnabled() === 1) {
				const latLng = pointRow.getLatLng();
				if (!isNaN(latLng.lat) || !isNaN(latLng.lng)) {
					coordinates.push(latLng);
				}
			}
		});

		return coordinates;
	}

	populatePointsTable (coordinates: L.LatLng[]): void {
		for (let i = 0; i < coordinates.length; i++) {
			this.rows[i].setLatLng(coordinates[i]);
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
		const query: HTMLElement = this.element.querySelector('tbody tr:nth-last-child(1 of :not(.d-none))')!;
		let lastEnabledRow: number = -1;
		if (query !== null) lastEnabledRow = parseInt(query.dataset.pointIndex as string);
		return lastEnabledRow;
	}

	addPoint (latLng: L.LatLng): void {
		console.log(this.getLastEnabledRowIdx());
		const pointRow = this.rows[1 + (this.getLastEnabledRowIdx() * 1)];
		console.log(pointRow);
		pointRow.enable().setLatLng(latLng);
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
			this.rows[i].setLatLng(coordinates[i]);
			this.rows[i].enable();
		}

		for (let i = coordinates.length; i < 50; i++) {
			this.rows[i].disable();
		}

		this.element.dispatchEvent(walkPointsChangedEvent);
	}
}

export function setupWalkFormValidation (
	formsToValidate: NodeListOf<HTMLFormElement>,
	walkForm: WalkForm
) {
	formsToValidate.forEach(form => {
		form.addEventListener('submit', event => {
			let enabledCount = 0;
			walkForm.rows.forEach((pointRow) => {
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

	formsToValidate.forEach(form => {
		form.addEventListener('reset', () => {
			console.log('Form was reset');
			window.setTimeout(() => { walkForm.reorder(); }, 0);
		});
	});
}
