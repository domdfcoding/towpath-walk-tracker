# stdlib
from typing import Tuple

# 3rd party
import folium

# this package
from towpath_walk_tracker.folium import Map, Sidebar, WalkStartEnd, ZoomStateJS

__all__ = ["create_map"]

tooltip_style: str = """
background-color: #F0EFEF;
border: 2px solid black;
border-radius: 3px;
box-shadow: 3px;
font-size: 12pt;
"""


def create_map(
		watercourses_geojson_file: str, map_centre: Tuple[float, float] = (55, -2), zoom_level: int = 6
		) -> Map:

	m = Map(map_centre, zoom_start=zoom_level, control_scale=True)
	m._id = "canal_towpath_walking"

	tooltip = folium.GeoJsonTooltip(
			fields=["id", "tags"],
			aliases=["ID", ''],
			localize=True,
			sticky=True,
			labels=True,
			style=tooltip_style,
			max_width=800,
			)

	g = folium.GeoJson(watercourses_geojson_file, embed=False, tooltip=tooltip, name="Watercourses").add_to(m)
	g._id = "watercourses"

	folium.LatLngPopup().add_to(m)
	WalkStartEnd().add_to(m)
	ZoomStateJS().add_to(m)
	folium.LayerControl().add_to(m)
	Sidebar().add_to(m)

	m.add_js_link("leaflet.geometryutil", "/static/leaflet.geometryutil.js")
	m.add_js_link("leaflet-sidebar.js", "/static/leaflet-sidebar.min.js")
	m.add_css_link(
			"font-awesome.min",
			"https://maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css",
			)
	m.add_css_link("leaflet-sidebar.css", "/static/leaflet-sidebar.min.css")

	return m
