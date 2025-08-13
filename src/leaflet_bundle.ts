// eslint-disable-next-line @typescript-eslint/no-unused-vars
export * from 'leaflet';
// Doesn't work. The npm package is in separate files
// and doesn't function the same as the dist version
// import "leaflet-sidebar";
import './leaflet-sidebar.min.js';
import 'leaflet-polylinedecorator';
import 'leaflet-geometryutil';

import './watercourses_geojson_utils.ts';
