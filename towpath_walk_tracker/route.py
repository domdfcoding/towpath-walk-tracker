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
from typing import Dict, List, Tuple

# 3rd party
import networkx
from networkx import all_shortest_paths
from scipy.spatial import KDTree  # type: ignore[import]

# this package
from towpath_walk_tracker.network import build_kdtree, build_network, get_node_coordinates
from towpath_walk_tracker.util import _get_filtered_watercourses

__all__ = ["Route"]


@lru_cache
def _get_network_and_tree() -> Tuple["networkx.Graph[int]", KDTree]:
	watercourses = _get_filtered_watercourses()
	G = build_network(watercourses)
	tree = build_kdtree(G)
	return G, tree


@dataclass
class Route:
	nodes: List[int]
	node_coordinates: Dict[int, Tuple[float, float]]

	@property
	def coordinates(self) -> List[Tuple[float, float]]:
		coords: List[Tuple[float, float]] = []
		for path_node in self.nodes:
			coords.append(self.node_coordinates[path_node])

		return coords

	@classmethod
	def from_points(cls, points: List[Tuple[float, float]]) -> "Route":

		G, tree = _get_network_and_tree()

		node_coordinates = get_node_coordinates(G)
		nckl = list(node_coordinates.keys())

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

		return cls(path, node_coordinates)
