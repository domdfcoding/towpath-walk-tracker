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
from io import BytesIO
import json
from typing import Any, Dict, List, Tuple, Union, cast

# 3rd party
from flask import Flask, Response, make_response, redirect, render_template, request, url_for
from flask_caching import Cache
from flask_compress import Compress  # type: ignore[import-untyped]
from flask_sqlalchemy_lite import SQLAlchemy
from flask_wtf.csrf import CSRFProtect  # type: ignore[import-untyped]
from folium import Figure, JavascriptLink

# this package
from towpath_walk_tracker.forms import WalkForm
from towpath_walk_tracker.map import create_basic_map, create_map
from towpath_walk_tracker.models import Walk
from towpath_walk_tracker.route import Route
from towpath_walk_tracker.util import _get_filtered_watercourses

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
app.config["SQLALCHEMY_ENGINES"] = {"default": "sqlite:///walks.db"}
app.jinja_env.globals["enumerate"] = enumerate

Compress(app)
cache = Cache(app)
csrf = CSRFProtect(app)
db = SQLAlchemy(app)  # type: ignore[arg-type]


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


@app.route("/all-walks/")
def all_walks() -> Response:
	"""
	Flask route for the walks JSON data.
	"""

	data = []
	with app.app_context():
		walk: Walk
		for walk in db.session.query(Walk).all():
			data.append(walk.to_json())

	return make_response(data)


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
		scripts.append(JavascriptLink(lib[1]).render())

	for child in root._children.values():
		child.render()

	form = WalkForm()
	if form.validate_on_submit():
		with app.app_context():
			walk = Walk.from_form(db, form)
			return redirect(f"/walk/{walk.id}")  # type: ignore[return-value]

	return render_template(
			"map.jinja2",
			form=form,
			header=root.header.render(),
			body=root.html.render(),
			script=root.script.render(),
			scripts='\n'.join(scripts)
			)


@app.route("/get-route/", methods=["POST"])
@csrf.exempt
def get_route() -> List[Tuple[float, float]]:
	"""
	Flask route to calculate a route along watercourses through points on a map.

	:returns: A list of coordinates of nodes along the path.
	"""

	points: List[Tuple[float, float]] = []
	for point in request.get_json():
		if isinstance(point, dict):
			points.append((cast(float, point["lat"]), cast(float, point["lng"])))
		else:
			points.append(tuple(point))

	print(f"Create walk with points {points}")

	return Route.from_points(points).coordinates


# @app.route("/walk", methods=["GET", "POST"])
# def walk():
# 	form = WalkForm()
# 	if form.validate_on_submit():
# 		print(form.data)
# 		return redirect("/success")
# 	return render_template("walk_form.jinja2", form=form)


@app.route("/api/walk/<int:walk_id>/")
def api_walk(walk_id: int) -> Response:
	# TODO: URL for thumbnail (with url_for)
	with app.app_context():
		result = db.session.query(Walk).get(walk_id)
		if result is None:
			return Response("Not Found", 404)

		data = cast(Walk, result).to_json()
		data["thumbnail_url"] = url_for("api_walk_thumbnail", walk_id=walk_id)
		return make_response(data)


@app.route("/api/walk/<int:walk_id>/thumbnail/")
def api_walk_thumbnail(walk_id: int) -> Response:
	with app.app_context():
		result = db.session.query(Walk).get(walk_id)
		if result is None:
			return Response("Not Found", 404)

		walk = cast(Walk, result)
		route = Route.from_db(walk.route)
		fig, ax = route.plot_thumbnail(
			figsize=(1.5, 1.5), 
			# colour=walk.colour,
			colour="#139c25",
			)

		buffer = BytesIO()
		fig.savefig(buffer, format='png')
		buffer.seek(0)
		image_png = buffer.getvalue()
		buffer.close()

		return Response(image_png, content_type="image/png")
		


@app.route("/walk/<int:walk_id>/", methods=["GET", "POST"])
def show_walk(walk_id: int) -> Union[Response, Dict[str, Any]]:

	with app.app_context():
		result = db.session.query(Walk).get(walk_id)
		if result is None:
			return Response("Not Found", 404)

		walk: Walk = cast(Walk, result)

		m = create_basic_map()

		root: Figure = m.get_root()  # type: ignore[assignment]

		js_libs = m.default_js
		m.default_js = []

		scripts = []
		for lib in js_libs:
			scripts.append(JavascriptLink(lib[1]).render())

		for child in root._children.values():
			child.render()

		form = WalkForm()
		form.title.default = walk.title
		form.start.default = walk.start
		form.duration.default = f"{walk.duration // 60:02d}:{walk.duration % 60:02d}"
		form.notes.default = walk.notes
		form.process()

		walk_points = [point.to_json() for point in walk.points]
		walk_route = [node.to_json() for node in walk.route]

	# if form.validate_on_submit():
	# 	with app.app_context():
	# 		walk = Walk.from_form(db, form)
	# 		return redirect(f"/walk/{walk.id}")  # type: ignore[return-value]

	return render_template(
			"single_walk_map.jinja2",
			form=form,
			walk_points=walk_points,
			walk_route=walk_route,
			header=root.header.render(),
			body=root.html.render(),
			script=root.script.render(),
			scripts='\n'.join(scripts)
			)
