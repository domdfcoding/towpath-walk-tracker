#!/usr/bin/env python3
#
#  map.py
"""
The map of watercourses and those which have been walked along.
"""
#
#  Copyright © 2025 Dominic Davis-Foster <dominic@davis-foster.co.uk>
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to deal
#  in the Software without restriction, including without limitation the rights
#  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#  copies of the Software, and to permit persons to whom the Software is
#  furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included in all
#  copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
#  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
#  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
#  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
#  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
#  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
#  OR OTHER DEALINGS IN THE SOFTWARE.
#

# stdlib
from typing import Tuple

# 3rd party
import folium
from xyzservices.lib import TileProvider  # type: ignore[import-untyped]

# this package
from towpath_walk_tracker.folium import (
		GeoJsonTooltip,
		Map,
		Sidebar,
		WalkStartEnd,
		WatercoursesGeoJson,
		ZoomStateJS
		)

__all__ = ["create_map"]

tooltip_style: str = """
background-color: #F0EFEF;
border: 2px solid black;
border-radius: 3px;
box-shadow: 3px;
font-size: 12pt;
"""


def create_map(
		watercourses_geojson_file: str,
		map_centre: Tuple[float, float] = (55, -2),
		zoom_level: int = 6,
		) -> Map:
	"""
	Create a folium/leaflet map showing the given watersources.

	:param watercourses_geojson_file:
	:param map_centre: The default map centre position.
	:param zoom_level: The default map zoom level.
	"""

	m = Map(map_centre, zoom_start=zoom_level, control_scale=True)
	m._id = "canal_towpath_walking"
	folium.TileLayer(TileProvider.from_qms("OpenTopoMap"), show=False).add_to(m)

	ZoomStateJS().add_to(m)
	Sidebar().add_to(m)

	tooltip = GeoJsonTooltip(
			fields=["id", "tags"],
			aliases=["ID", ''],
			localize=True,
			sticky=True,
			labels=True,
			style=tooltip_style,
			max_width=800,
			)

	g = WatercoursesGeoJson(watercourses_geojson_file, tooltip=tooltip).add_to(m)

	FeatureGroupWalkMarkers().add_to(m)
	feature_group_walks = FeatureGroupWalks().add_to(m)
	feature_group_current_walk = FeatureGroupCurrentWalk().add_to(m)

	m.keep_in_front(g, feature_group_walks, feature_group_current_walk)  # type: ignore[arg-type]

	LayerControl().add_to(m)
	WalkStartEnd().add_to(m)

	return m


class FeatureGroupWalkMarkers(folium.FeatureGroup):

	def __init__(self):
		super().__init__(name="Walk Markers", control=False)
		self._id = "walk_markers"


class FeatureGroupCurrentWalk(folium.FeatureGroup):

	def __init__(self):
		super().__init__(name="Current Walk", control=False)
		self._id = "current_walk"


class FeatureGroupWalks(folium.FeatureGroup):

	def __init__(self):
		super().__init__(name="Walks", control=False)
		self._id = "walks"


class LayerControl(folium.LayerControl):

	def __init__(self):
		super().__init__()
		self._id = "layer_control"


def create_basic_map() -> Map:

	m = Map(control_scale=True)
	m._id = "canal_towpath_walking"
	folium.TileLayer(TileProvider.from_qms("OpenTopoMap"), show=False).add_to(m)

	FeatureGroupWalkMarkers().add_to(m)
	FeatureGroupCurrentWalk().add_to(m)

	LayerControl().add_to(m)
	WalkStartEnd().add_to(m)

	return m
