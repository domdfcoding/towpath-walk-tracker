#!/usr/bin/env python3
#
#  util.py
"""
Utility functions.
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
from functools import lru_cache
from typing import NamedTuple

# 3rd party
from domdf_python_tools.paths import PathPlus

# this package
from towpath_walk_tracker.watercourses import FeatureCollection, exclude_tags, filter_watercourses

__all__ = (
		"ids_to_exclude",
		"overpass_query",
		"Coordinate",
		)

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

ids_to_exclude = {
		28500157,
		4675033,
		1087548847,
		101433748,
		138647179,
		588173692,
		25791346,
		25744981,
		82470121,
		25787029,
		27803787
		}


@lru_cache
def _get_filtered_watercourses() -> FeatureCollection:
	raw_data = PathPlus("data.filtered.geojson").load_json()
	watercourses = filter_watercourses(raw_data, tags_to_exclude=exclude_tags, ids_to_exclude=ids_to_exclude)
	return watercourses


class Coordinate(NamedTuple):
	"""
	A coordinate (latitude and longitude).
	"""

	latitude: float
	longitude: float
