#!/usr/bin/env python3
#
#  folium.py
"""
Extensions/changes to folium.
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
from typing import Any, Optional, Union

# 3rd party
import folium
from domdf_python_tools.compat import importlib_resources
from folium import Figure
from folium.map import Layer
from folium.template import Template
from folium.utilities import remove_empty

__all__ = ["Map", "Sidebar", "WalkStartEnd", "ZoomStateJS"]


def _load_template(name: str) -> Template:
	return Template(importlib_resources.read_text("towpath_walk_tracker.templates", name))


class Map(folium.Map):  # noqa: D101
	_template = _load_template("folium_map.jinja2")


class WalkStartEnd(folium.MacroElement):
	"""
	Handle clicking for start/end of a walk.
	"""

	_template = _load_template("walk_start_end.jinja2")

	def __init__(self):
		super().__init__()
		self._name = "WalkStartEnd"


class ZoomStateJS(folium.MacroElement):
	"""
	Update URL with current zoom/position.
	"""

	_template = Template(
			"""
		{% macro script(this, kwargs) %}
			setupZoomState({{this._parent.get_name()}});
		{% endmacro %}
		"""
			)

	def __init__(self):
		super().__init__()
		self._name = "ZoomStateJS"

	def add_to(  # noqa: D102
		self,
		parent: folium.Element,
		name: Optional[str] = None,
		index: Optional[int] = None,
		) -> "ZoomStateJS":
		super().add_to(parent, name, index)
		assert isinstance(parent, folium.Map)
		parent.add_js_link("zoom-state", "/static/zoom_state.js")
		return self


class WatercoursesGeoJson(folium.GeoJson):

	def __init__(
			self,
			data: Any,
			popup_keep_highlighted: bool = False,
			name: Optional[str] = None,
			overlay: bool = True,
			control: bool = True,
			show: bool = True,
			smooth_factor: Optional[float] = None,
			tooltip: Union[str, folium.Tooltip, "folium.GeoJsonTooltip", None] = None,
			popup: Optional["folium.GeoJsonPopup"] = None,
			zoom_on_click: bool = False,
			on_each_feature: Optional[folium.JsCode] = None,
			marker: Union[folium.Circle, folium.CircleMarker, folium.Marker, None] = None,
			**kwargs: Any,
			):
		Layer.__init__(self, name=name, overlay=overlay, control=control, show=show)
		self._name = "GeoJson"
		self.embed = False
		self.embed_link: Optional[str] = data
		self.json = None
		self.parent_map = None
		self.smooth_factor = smooth_factor
		self.style = False
		self.highlight = False
		self.zoom_on_click = zoom_on_click
		if marker and not isinstance(marker, (folium.Circle, folium.CircleMarker, folium.Marker)):
			raise TypeError("Only Marker, Circle, and CircleMarker are supported as GeoJson marker types.")

		if popup_keep_highlighted and popup is None:
			raise ValueError("A popup is needed to use the popup_keep_highlighted feature")
		self.popup_keep_highlighted = popup_keep_highlighted

		self.marker = marker
		self.on_each_feature = on_each_feature
		self.options = remove_empty(**kwargs)

		if isinstance(tooltip, (folium.GeoJsonTooltip, folium.Tooltip)):
			self.add_child(tooltip)
		elif tooltip is not None:
			self.add_child(folium.Tooltip(tooltip))
		if isinstance(popup, (folium.GeoJsonPopup, folium.Popup)):
			self.add_child(popup)


class GeoJsonTooltip(folium.GeoJsonTooltip):

	def render(self, **kwargs) -> None:  # type: ignore[override]
		if not isinstance(self._parent, (folium.GeoJson, folium.TopoJson)):
			raise TypeError(f"You cannot add a {self._name} to anything other than a GeoJson or TopoJson object.")

		root: Figure = self.get_root()  # type: ignore[assignment]
		root.header.add_child(
				folium.Element(_load_template("geojson_tooltip_css.jinja2").render(this=self)),
				name=self.get_name() + "tablestyle",
				)

		folium.MacroElement.render(self)


class Sidebar(folium.MacroElement):
	"""
	JavaScript implementation for ``folium-sidebar-v2``.
	"""

	_template = _load_template("sidebar.jinja2")

	def __init__(self):
		super().__init__()
		self._name = "Sidebar"

	# def render(self, **kwargs):
	# 	super().render(**kwargs)

	# 	figure = self.get_root()
	# 	html = figure.html._children
	# 	us = html[self.get_name()]
	# 	new_html = html.__class__()
	# 	new_html[self.get_name()] = us
	# 	for k, v in html.items():
	# 		if k != self.get_name():
	# 			new_html[k] = v

	# 	figure.html._children = new_html
