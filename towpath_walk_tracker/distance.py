#!/usr/bin/env python3
#
#  distance.py
"""
Distance calculation.
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
from collections.abc import Iterable
from math import atan2, cos, radians, sin, sqrt

# 3rd party
from domdf_folium_tools import Coordinates

__all__ = ["calculate_walk_distance", "format_distance", "haversine_formula"]


def format_distance(distance_km: float) -> str:
	"""
	Format the given distance as kilometers or, for small values, metres.

	:param distance_km:
	"""

	if distance_km < 1.1:
		return f'{distance_km*1000:.0f} m'
	else:
		return f"{distance_km:.1f} km"


def calculate_walk_distance(points: Iterable[Coordinates]) -> float:
	"""
	Calculate the length of the walk (in km) through the given nodes.

	:param points:
	"""

	points = list(points)

	if not points:
		return 0

	total_distance = 0.0
	last_point = points.pop()
	assert last_point is not None

	while points:
		current_point = points.pop()
		assert current_point is not None

		total_distance += (
				haversine_formula(
						last_point["latitude"],
						last_point["longitude"],
						current_point["latitude"],
						current_point["longitude"],
						)
				)
		last_point = current_point

	return total_distance


def haversine_formula(lat1_deg: float, lng1_deg: float, lat2_deg: float, lng2_deg: float) -> float:
	"""
	Calculate the distance between two coordinates, in kilometers.

	:param lat1_deg: Latitude 1 in degrees,
	:param lng1_deg: Longitude 1 in degrees,
	:param lat2_deg: Latitude 2 in degrees,
	:param lng2_deg: Longitude 2 in degrees,
	"""

	lat1 = radians(lat1_deg)
	lng1 = radians(lng1_deg)
	lat2 = radians(lat2_deg)
	lng2 = radians(lng2_deg)

	dlng = lng2 - lng1
	dlat = lat2 - lat1

	a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlng / 2)**2
	c = 2 * atan2(sqrt(a), sqrt(1 - a))

	# Approximate radius of earth in km
	R = 6373.0

	return R * c
