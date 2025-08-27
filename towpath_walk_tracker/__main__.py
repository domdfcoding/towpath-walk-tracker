#!/usr/bin/env python3
#
#  __main__.py
"""
Command-line entry point.
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

# 3rd party
from consolekit import CONTEXT_SETTINGS, SuggestionGroup, click_group
from consolekit.options import flag_option

__all__ = ["create_db", "get_data", "main", "run"]


@click_group(cls=SuggestionGroup, invoke_without_command=False, context_settings=CONTEXT_SETTINGS)
def main() -> None:
	"""
	Development tools for towpath-walk-tracker.
	"""


@main.command()
def run() -> None:
	"""
	Run the towpath-walk-tracker development flask server in debug mode.
	"""

	# stdlib
	from pathlib import Path

	# 3rd party
	import contextily  # type: ignore[import-untyped]
	from domdf_python_tools.paths import PathPlus
	from flask_debugtoolbar import DebugToolbarExtension  # noqa: F401

	# this package
	from towpath_walk_tracker.flask import app

	contextily.set_cache_dir(PathPlus("cache").abspath())

	app.jinja_env.auto_reload = True
	app.config["TEMPLATES_AUTO_RELOAD"] = True
	app.debug = True
	# DebugToolbarExtension(app)
	app.run(debug=True, extra_files=list(Path("towpath_walk_tracker/templates").glob("*.jinja2")))


@main.command()
def create_db() -> None:
	"""
	Configure the towpath-walk-tracker database for the first time.
	"""

	# this package
	from towpath_walk_tracker.flask import app, db
	from towpath_walk_tracker.models import Model

	with app.app_context():
		Model.metadata.create_all(db.engine)


@flag_option("-d/-D", "--download/--no-download", default=True)
@main.command()
def get_data(download: bool = True) -> None:
	"""
	Query overpass for watercourses data.
	"""

	# stdlib
	import json

	# 3rd party
	from networkx import connected_components

	# this package
	from towpath_walk_tracker.network import build_network
	from towpath_walk_tracker.util import overpass_query
	from towpath_walk_tracker.watercourses import FeatureCollection, filter_watercourses, query_overpass

	if download:
		data = query_overpass(overpass_query)

		with open("data.geojson", 'w', encoding="UTF-8") as fp:
			json.dump(data, fp, indent=2)

	else:
		with open("data.geojson", encoding="UTF-8") as fp:
			data = json.load(fp)

	watercourses = filter_watercourses(data)
	network = build_network(watercourses)

	nodes_to_exclude = set()
	for nodes in connected_components(network):
		if len(nodes) < 22:
			nodes_to_exclude.update(nodes)

	filtered_data: FeatureCollection = {"type": "FeatureCollection", "features": []}

	for feature in data["features"]:
		if feature["geometry"]["type"] == "Point":
			filtered_data["features"].append(feature)
			continue

		if "nodes" not in feature["properties"]:
			filtered_data["features"].append(feature)
			continue

		if not nodes_to_exclude.intersection(feature["properties"]["nodes"]):
			filtered_data["features"].append(feature)
			continue

	with open("data.filtered.geojson", 'w', encoding="UTF-8") as fp:
		json.dump(filtered_data, fp, indent=2)


if __name__ == "__main__":
	main()
