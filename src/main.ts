// eslint-disable-next-line @typescript-eslint/no-unused-vars
import 'leaflet';

// === Sidebar ===
// Doesn't work. The npm package is in separate files
// and doesn't function the same as the dist version
// import "leaflet-sidebar";
import './leaflet-sidebar.min.js';

// === Walks & Watercourses ===
import 'leaflet-polylinedecorator';
import 'leaflet-geometryutil';
import { LeafletWalkPreview, drawWalk, drawPreviousWalks } from './core/walk';
import { watercoursesZoomOnClick, addWatercoursesGeoJson } from './core/watercourses_geojson_utils';

// === Map ===
import { setupZoomState, zoomStateFromURL } from './zoom_state';
import { setupResizeObserver } from './core/map';

// === Walk Form ===
import 'flatpickr';
import { WalkForm, walkPointsChangedEvent, setupWalkFormValidation } from './core/walk_form';

// @ts-expect-error  // Exporting to "window" global namespace
window.watercoursesZoomOnClick = watercoursesZoomOnClick;

// @ts-expect-error  // Exporting to "window" global namespace
window.addWatercoursesGeoJson = addWatercoursesGeoJson;

// @ts-expect-error  // Exporting to "window" global namespace
window.LeafletWalkPreview = LeafletWalkPreview;

// @ts-expect-error  // Exporting to "window" global namespace
window.drawWalk = drawWalk;

// @ts-expect-error  // Exporting to "window" global namespace
window.drawPreviousWalks = drawPreviousWalks;

// @ts-expect-error  // Exporting to "window" global namespace
window.WalkForm = WalkForm;

// @ts-expect-error  // Exporting to "window" global namespace
window.walkPointsChangedEvent = walkPointsChangedEvent;

// @ts-expect-error  // Exporting to "window" global namespace
window.setupWalkFormValidation = setupWalkFormValidation;

// @ts-expect-error  // Exporting to "window" global namespace
window.setupZoomState = setupZoomState;

// @ts-expect-error  // Exporting to "window" global namespace
window.zoomStateFromURL = zoomStateFromURL;

// @ts-expect-error  // Exporting to "window" global namespace
window.setupResizeObserver = setupResizeObserver;
