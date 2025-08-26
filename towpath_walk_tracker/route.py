#!/usr/bin/env python3
#
#  route.py
"""
Functions for finding a route through two or more points.
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
from dataclasses import dataclass
from functools import lru_cache
from typing import TYPE_CHECKING, Dict, List, Literal, Tuple, Union, cast

# 3rd party
import contextily  # type: ignore[import-untyped]
import geopandas  # type: ignore[import-untyped]
import matplotlib
import networkx
from geopandas.plotting import GeoplotAccessor  # type: ignore[import-untyped]
from matplotlib.axes import Axes
from matplotlib.figure import Figure
from networkx import all_shortest_paths
from scipy.spatial import KDTree
from shapely.geometry import LineString

# this package
from towpath_walk_tracker.network import build_kdtree, build_network, get_node_coordinates
from towpath_walk_tracker.util import Coordinate, _get_filtered_watercourses

if TYPE_CHECKING:
	# this package
	from towpath_walk_tracker.models import Node

__all__ = ["Route"]


@lru_cache
def _get_network_and_tree() -> Tuple["networkx.Graph[int]", KDTree]:
	watercourses = _get_filtered_watercourses()
	G = build_network(watercourses)
	tree = build_kdtree(G)
	return G, tree


@dataclass
class Route:
	"""
	Represents a route constructed through two or more points.
	"""

	# IDs of every node along the route.
	nodes: List[int]

	# Mapping of IDs to lat/lng coordinates.
	node_coordinates: Dict[int, Coordinate]

	@property
	def coordinates(self) -> List[Coordinate]:
		"""
		Returns the coordinates of the nodes, in order.
		"""

		coords: List[Coordinate] = []
		for path_node in self.nodes:
			coords.append(self.node_coordinates[path_node])

		return coords

	@classmethod
	def from_db(cls, nodes: List["Node"]) -> "Route":
		"""
		Construct a :class:`~.Route` from the database.

		:param nodes:
		"""

		node_coordinates = {}
		node_ids = []
		for node in nodes:
			node_ids.append(node.id)
			node_coordinates[node.id] = Coordinate(cast(float, node.latitude), cast(float, node.longitude))

		return cls(node_ids, node_coordinates)

	@classmethod
	def from_json_dict(cls, data: List[Dict[str, float]]) -> "Route":
		"""
		Construct a :class:`~.Route` from the given JSON data.

		:param nodes:
		"""

		node_coordinates = {}
		node_ids: List[int] = []
		for node in data:
			node_id = cast(int, node["id"])
			node_ids.append(node_id)
			coord = Coordinate(cast(float, node["latitude"]), cast(float, node["longitude"]))
			node_coordinates[node_id] = coord

		return cls(node_ids, node_coordinates)

	def to_linestring(self) -> LineString:
		"""
		Create a shapely :class:`~shapely.geometry.LineString` for the route.
		"""

		route: List[Tuple[float, float]] = [(r.longitude, r.latitude) for r in self.coordinates]
		return LineString(route)

	@classmethod
	def from_points(cls, points: List[Tuple[float, float]]) -> "Route":
		"""
		Construct a route from a list of coordinates the route must pass through.

		:param points:
		"""

		G, tree = _get_network_and_tree()

		node_coordinates = get_node_coordinates(G)
		nckl = list(node_coordinates.keys())

		point_data: List[Tuple[Tuple[float, float], float, int, int]] = []
		node_dist: float
		node_idx: int
		for coord in points:
			coord = cast(Tuple[float, float], coord)
			node_dist, node_idx = cast(Tuple[float, int], tree.query(coord))
			node = nckl[node_idx]
			point_data.append((coord, node_dist, node_idx, node))

		# solve path from 1st node to 2nd node to... nth node
		path: List[int] = []
		for orig, dest in zip(point_data[:-1], point_data[1:]):
			path = path[:-1] + next(all_shortest_paths(G, orig[3], dest[3]))

		return cls(path, node_coordinates)

	def plot_thumbnail(
			self,
			figsize: Tuple[float, float] = (2, 2),
			zoom: Union[Literal["auto"], int] = "auto",
			zoom_adjust: int = -2,
			colour: str = "#139c25",
			linewidth: int = 5,
			) -> Tuple[Figure, Axes]:
		"""
		Plot the walk against the OpenStreetMap base map as a small thumbnail image.

		:param figsize: The image size in inches.
		:param zoom: Base map zoom level.
		:param zoom_adjust: Adjust the automatic zoom level by this amount.
		:param colour: The walk line colour.
		:param linewidth: The walk line width.
		"""

		matplotlib.rcParams["axes.xmargin"] = matplotlib.rcParams["axes.ymargin"] = 0.2

		# TODO: support non-square sizes
		df = geopandas.GeoDataFrame(
				{"ID": [0], "geometry": [self.to_linestring()]},
				crs="EPSG:4326",
				).to_crs(epsg=3857)

		plot_fn: GeoplotAccessor = df.plot
		ax = plot_fn(figsize=figsize, alpha=0.5, edgecolor=colour, linewidth=linewidth)
		fig = ax.get_figure()

		ax.set_axis_off()
		fig.tight_layout()
		fig.subplots_adjust(top=1, right=1, bottom=0, left=0)

		tightbox = ax.get_tightbbox()
		x_width = tightbox.x1 - tightbox.x0
		y_height = tightbox.y1 - tightbox.y0
		ratio = y_height / x_width

		xlim = ax.get_xlim()
		current_x_range = xlim[1] - xlim[0]
		new_x_range = current_x_range * ratio
		x_range_delta = (new_x_range - current_x_range) / 2
		ax.set_xlim(xlim[0] - x_range_delta, xlim[1] + x_range_delta)

		# TODO: credits somewhere on website; footer maybe?
		# © OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France
		contextily.add_basemap(ax, zoom=zoom, attribution=False, zoom_adjust=zoom_adjust)

		return fig, ax
