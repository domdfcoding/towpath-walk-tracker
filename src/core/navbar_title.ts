export function setupNavbarTitleScroll () {
	// The top-of-page navbar
	const navbar: HTMLElement | null = document.querySelector('.navbar.fixed-top');
	// The main "brand" button
	const navbarBrand: HTMLElement | null = document.querySelector('.navbar.fixed-top .navbar-brand:not(navbar-page-title)');
	// The page title button
	const navbarPageTitle: HTMLElement | null = document.querySelector('.navbar.fixed-top .navbar-page-title');

	if (navbar == null) {
		console.error("'navbar.fixed-top' not found.");
		return;
	}
	if (navbarBrand == null) {
		console.error("'navbar-brand' not found.");
		return;
	}
	if (navbarPageTitle == null) {
		console.error("'navbar-page-title' not found.");
		return;
	}

	window.onscroll = () => {
		// Change the navbar label to the page title
		if (window.scrollY > 200) {
			navbar.classList.add('nav-scrolled');
			navbarBrand.tabIndex = -1;
			navbarPageTitle.removeAttribute('tabindex');
		} else {
			navbar.classList.remove('nav-scrolled');
			navbarPageTitle.tabIndex = -1;
			navbarBrand.removeAttribute('tabindex');
		}
	};
}
