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

# stdlib
from functools import partial

# 3rd party
from consolekit import CONTEXT_SETTINGS, SuggestionGroup, click_group

# this package
from towpath_walk_tracker.flask import app

__all__ = ["create_db", "get_data", "main", "run"]


@click_group(cls=SuggestionGroup, invoke_without_command=False, context_settings=CONTEXT_SETTINGS)
def main() -> None:
	"""
	Development tools for towpath-walk-tracker.
	"""


command = partial(main.command, context_settings=CONTEXT_SETTINGS)
group = partial(main.group, context_settings=CONTEXT_SETTINGS, cls=SuggestionGroup)


@command()
def run() -> None:
	"""
	Run the towpath-walk-tracker development flask server in debug mode.
	"""

	# 3rd party
	from flask_debugtoolbar import DebugToolbarExtension

	app.debug = True
	DebugToolbarExtension(app)
	app.run(debug=True)


@command()
def create_db() -> None:
	"""
	Configure the towpath-walk-tracker database for the first time.
	"""

	# this package
	from towpath_walk_tracker.models import db

	with app.app_context():
		db.create_all()


overpass_query = """
[out:json][timeout:200];
area(id:3600062149)->.searchArea;
(
nwr["waterway"="canal"](area.searchArea);
nwr["waterway"="river"]["boat"="yes"](area.searchArea);
nwr["tunnel"="canal"]["towpath"="yes"](area.searchArea);
nwr["leisure"="marina"](area.searchArea);
nwr["water"="basin"](area.searchArea);
nwr["water"="reservoir"](area.searchArea);
);
out geom;
"""


@command()
def get_data() -> None:
	"""
	Query overpass for watercourses data.
	"""

	# stdlib
	import json

	# this package
	from towpath_walk_tracker.watercourses import query_overpass

	data = query_overpass(overpass_query)

	with open("data.geojson", 'w', encoding="UTF-8") as fp:
		json.dump(data, fp, indent=2)


if __name__ == "__main__":
	main()
