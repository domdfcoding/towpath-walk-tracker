// eslint-disable-next-line @typescript-eslint/no-unused-vars
export * from 'leaflet';
// Doesn't work. The npm package is in separate files
// and doesn't function the same as the dist version
// import "leaflet-sidebar";
import './leaflet-sidebar.min.js';
import 'leaflet-polylinedecorator';
import 'leaflet-geometryutil';

import { LeafletWalkPreview } from './core/walk';
import { WalkForm, walkPointsChangedEvent, setupWalkFormValidation } from './core/walk_form';
import { watercoursesZoomOnClick, addWatercoursesGeoJson } from './core/watercourses_geojson_utils';
import { setupZoomState, zoomStateFromURL } from './zoom_state';

// @ts-expect-error  // Exporting to "window" global namespace
window.watercoursesZoomOnClick = watercoursesZoomOnClick;

// @ts-expect-error  // Exporting to "window" global namespace
window.addWatercoursesGeoJson = addWatercoursesGeoJson;

// @ts-expect-error  // Exporting to "window" global namespace
window.LeafletWalkPreview = LeafletWalkPreview;

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
