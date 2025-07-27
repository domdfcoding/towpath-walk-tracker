#!/usr/bin/env python3
#
#  flask.py
"""
Flask routes and helper functions.
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
import itertools
from functools import lru_cache
from typing import Any, Callable, Iterable, List, Optional, Sequence, Tuple, Union

# 3rd party
import networkx
from domdf_python_tools.paths import PathPlus
from flask import Flask, Response, json, redirect, render_template, request
from flask_caching import Cache
from flask_compress import Compress  # type: ignore[import]
from flask_wtf import FlaskForm  # type: ignore[import]
from flask_wtf.csrf import CSRFProtect  # type: ignore[import]
from folium import Figure, JavascriptLink
from networkx import all_shortest_paths
from scipy.spatial import KDTree  # type: ignore[import]
from wtforms import (
		DateTimeLocalField,
		Field,
		FieldList,
		FloatField,
		Form,
		FormField,
		IntegerField,
		StringField,
		TextAreaField,
		TimeField
		)
from wtforms.validators import DataRequired, InputRequired, NumberRange

# this package
from towpath_walk_tracker.map import create_map
from towpath_walk_tracker.network import build_kdtree, build_network, get_node_coordinates
from towpath_walk_tracker.watercourses import FeatureCollection, exclude_tags, filter_watercourses

__all__ = ["add_walk", "leaflet_map", "watercourses_geojson"]

app = Flask(__name__)

app.config["COMPRESS_ALGORITHM"] = ["gzip"]
app.config["COMPRESS_MIMETYPES"] = [
		"text/html",
		"text/css",
		"text/plain",
		"application/javascript",
		"application/json",
		"application/manifest+json",
		"application/vnd.api+json",
		"application/x-font-ttf",
		"application/x-font-opentype",
		"application/x-font-truetype",
		"image/svg+xml",
		"image/x-icon",
		"image/vnd.microsoft.icon",
		"font/ttf",
		"font/otf",
		"font/opentype",
		"application/geo+json",
		]
app.config["CACHE_TYPE"] = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 300
app.config["SECRET_KEY"] = "1234"
app.jinja_env.globals["enumerate"] = enumerate

Compress(app)
cache = Cache(app)
csrf = CSRFProtect(app)


@app.route("/watercourses.geojson")
@cache.cached()
def watercourses_geojson() -> Response:
	"""
	Flask route for the watercourses GeoJSON data.
	"""

	data = _get_filtered_watercourses()
	# TODO: client-side cache headers
	resp = Response(json.dumps(data), 200, headers={"Content-Type": "application/geo+json"})
	return resp


@app.route('/', methods=["GET", "POST"])
def main_page() -> Union[str, Response]:
	"""
	Flask route for the main page.
	"""

	# zoom_level = int(request.args.get("zoom", 6))
	# lat = float(request.args.get("lat", 55))
	# lng = float(request.args.get("lng", -2))
	# print(zoom_level, lat, lng)
	m = create_map("http://localhost:5000/watercourses.geojson")  # , (lat, lng), zoom_level)
	root: Figure = m.get_root()  # type: ignore[assignment]

	js_libs = m.default_js
	m.default_js = []

	scripts = []
	for lib in js_libs:
		if lib[0] not in {"bootstrap"}:
			scripts.append(JavascriptLink(lib[1]).render())

	for child in root._children.values():
		child.render()

	form = WalkForm()
	if form.validate_on_submit():
		return redirect("/success")  # type: ignore[return-value]

	return render_template(
			"map.jinja2",
			form=form,
			header=root.header.render(),
			body=root.html.render(),
			script=root.script.render(),
			scripts='\n'.join(scripts)
			)


@lru_cache
def _get_filtered_watercourses() -> FeatureCollection:
	raw_data = PathPlus("data.geojson").load_json()
	watercourses = filter_watercourses(raw_data, tags_to_exclude=exclude_tags)
	return watercourses


@lru_cache
def _get_network_and_tree() -> Tuple["networkx.Graph[int]", KDTree]:
	watercourses = _get_filtered_watercourses()
	G = build_network(watercourses)
	tree = build_kdtree(G)
	return G, tree


@app.route("/get-route", methods=["POST"])
@csrf.exempt
def get_route() -> List[Tuple[float, float]]:
	"""
	Flask route to calculate a route along watercourses through points on a map.

	:returns: A list of coordinates of nodes along the path.
	"""

	points: List[Tuple[float, float]] = []
	for point in request.get_json():
		if isinstance(point, dict):
			points.append((point["lat"], point["lng"]))
		else:
			points.append(tuple(point))  # type: ignore[arg-type]

	print(f"Create walk with points {points}")

	G, tree = _get_network_and_tree()

	nckl = list(get_node_coordinates(G).keys())

	point_data: List[Tuple[Tuple[float, float], float, int, int]] = []
	node_dist: float
	node_idx: int
	for coord in points:
		node_dist, node_idx = tree.query(coord)
		node = nckl[node_idx]
		point_data.append((coord, node_dist, node_idx, node))

	# solve path from 1st node to 2nd node to... nth node
	path: List[int] = []
	for orig, dest in zip(point_data[:-1], point_data[1:]):
		path = path[:-1] + next(all_shortest_paths(G, orig[3], dest[3]))  # type: ignore[call-overload]

	coords: List[Tuple[float, float]] = []
	for path_node in path:
		coords.append((G.nodes[path_node]["lat"], G.nodes[path_node]["lng"]))

	return coords


class PointForm(FlaskForm):
	latitude = FloatField(
			"latitude",
			validators=[InputRequired(), NumberRange(min=-180, max=180, message="Invalid coordinate")],
			)
	longitude = FloatField(
			"longitude",
			validators=[InputRequired(), NumberRange(min=-180, max=180, message="Invalid coordinate")],
			)
	# id = IntegerField("id", validators=[InputRequired()])
	enabled = IntegerField(
			"Enabled",
			validators=[InputRequired(), NumberRange(min=0, max=1, message="Invalid Value")],
			default=0,
			)


class FieldListMinRequired(FieldList):

	def __init__(
			self,
			unbound_field: Field,
			label: Optional[str] = None,
			min_required_entries: int = 0,
			min_entries: int = 0,
			max_entries: Optional[int] = None,
			separator: str = '-',
			default: Union[Iterable[Any], Callable[[], Iterable[Any]]] = (),
			**kwargs,
			):
		super().__init__(
				unbound_field=unbound_field,
				label=label,
				validators=[DataRequired()],
				min_entries=min_entries,
				max_entries=max_entries,
				separator=separator,
				default=default,
				**kwargs
				)
		self.min_required_entries = min_required_entries

	def validate(  # type: ignore[override]
		self,
		form: Form,
		extra_validators: Sequence[Callable] = (),
		) -> bool:

		num_valid = 0
		self.errors = []

		# Run validators on all entries within
		for subfield in self.entries:
			if subfield.validate(form):
				num_valid += 1

		if num_valid >= self.min_required_entries:
			self.errors = []
		else:
			self.errors = [{
					"id": [f"A minimum of {self.min_required_entries} entries are required; got {num_valid}."]
					}]

		chain = itertools.chain(self.validators, extra_validators)  # type: ignore[arg-type]
		self._run_validation_chain(form, chain)  # type: ignore[attr-defined]

		return len(self.errors) == 0


class WalkForm(FlaskForm):
	points = FieldListMinRequired(FormField(PointForm), min_required_entries=2, min_entries=50)
	title = StringField("Title")  # , validators=[DataRequired()])
	start = DateTimeLocalField("Start")  # , validators=[DataRequired()])
	duration = TimeField("Duration")  # , validators=[DataRequired()])
	notes = TextAreaField("Notes")  # , validators=[DataRequired()])


# @app.route("/walk", methods=["GET", "POST"])
# def walk():
# 	form = WalkForm()
# 	if form.validate_on_submit():
# 		print(form.data)
# 		return redirect("/success")
# 	return render_template("walk_form.jinja2", form=form)
