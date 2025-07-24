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
from typing import Optional

# 3rd party
import folium
from domdf_python_tools.compat import importlib_resources
from folium.template import Template

__all__ = ["Map", "Sidebar", "WalkStartEnd", "ZoomStateJS"]


def _load_template(name: str) -> Template:
	return Template(importlib_resources.read_text("towpath_walk_tracker.templates", name))


class Map(folium.Map):
	_template = _load_template("map.jinja2")


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
			setupZoomState({{this._parent.get_name()}})
		{% endmacro %}
		"""
			)

	def __init__(self):
		super().__init__()
		self._name = "ZoomStateJS"

	def add_to(
			self,
			parent: folium.Element,
			name: Optional[str] = None,
			index: Optional[int] = None,
			) -> "ZoomStateJS":
		super().add_to(parent, name, index)
		assert isinstance(parent, folium.Map)
		parent.add_js_link("zoom-state", "/static/zoom_state.js")
		return self


class Sidebar(folium.MacroElement):

	_template = _load_template("sidebar.jinja2")

	def __init__(self):
		super().__init__()
		self._name = "Sidebar"

	def render(self, **kwargs):
		super().render(**kwargs)

		figure = self.get_root()
		html = figure.html._children
		us = html[self.get_name()]
		new_html = html.__class__()
		new_html[self.get_name()] = us
		for k, v in html.items():
			if k != self.get_name():
				new_html[k] = v

		figure.html._children = new_html
