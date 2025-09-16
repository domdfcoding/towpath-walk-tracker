import { updateQueryStringParam } from './util';

export class WalkListDisplay {
	walkGrid: HTMLDivElement;
	gridToggleBtn: HTMLButtonElement;

	constructor (walkGrid: HTMLDivElement, gridToggleBtn: HTMLButtonElement) {
		this.walkGrid = walkGrid;
		this.gridToggleBtn = gridToggleBtn;
	}

	applyURLParams () {
		const url = new URL(window.location.href);

		if (url.searchParams.has('view')) {
			const view: string = url.searchParams.get('view')!;
			console.log(view);
			if (view === 'list') this.setListView();
			// if (view === "grid") this.setGridView();
		}
	}

	setListView () {
		this.walkGrid.classList.remove('row');
		this.gridToggleBtn.firstElementChild!.classList.replace('fa-th-large', 'fa-th-list');
		updateQueryStringParam('view', 'list');
	}

	setGridView () {
		this.walkGrid.classList.add('row');
		this.gridToggleBtn.firstElementChild!.classList.replace('fa-th-list', 'fa-th-large');
		updateQueryStringParam('view', 'grid');
	}

	toggleGridDisplay () {
		if (this.walkGrid.classList.contains('row')) {
			this.setListView();
		} else {
			this.setGridView();
		}
	}
}
