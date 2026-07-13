// Warns when leaving page if changes are unsaved

export class SaveWatcher {
	enabled: boolean;

	constructor () {
		this.enabled = false;
	}

	enable () {
		this.enabled = true;
		window.addEventListener('beforeunload', this.showmsg);
	}

	disable () {
		this.enabled = false;
		window.removeEventListener('beforeunload', this.showmsg);
	}

	showmsg (event: BeforeUnloadEvent) {
		event.preventDefault(); // Required for modern browsers
		event.returnValue = ''; // Required for old browsers
	}
}
