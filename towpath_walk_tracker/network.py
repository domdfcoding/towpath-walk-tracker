#!/usr/bin/env python3
#
#  network.py
"""
Model of the network of rivers and canals.
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
import networkx
from scipy.spatial import KDTree

# this package
from towpath_walk_tracker.util import Coordinate
from towpath_walk_tracker.watercourses import FeatureCollection

__all__ = ["build_kdtree", "build_network", "get_node_coordinates"]


def build_network(watercourses: FeatureCollection) -> "networkx.Graph[int]":
	"""
	Construct a network of paths through the given watercourses.

	:param watercourses:
	"""

	graph: "networkx.Graph[int]" = networkx.Graph()

	for wc in watercourses["features"]:
		# if wc["properties"]["type"] != "way":
		# 	continue

		nodes = wc["properties"]["nodes"]
		coordinates = wc["geometry"]["coordinates"]
		# graph.add_nodes_from(nodes)

		if wc["geometry"]["type"] == "Polygon":  # vs LineString
			previous_node = nodes[-1]
			assert len(coordinates) == 1
			coordinates = coordinates[0]
		else:
			previous_node = None

		for node, coord in zip(nodes, coordinates):
			assert len(coord) == 2

			if graph.has_node(node):
				assert graph.nodes[node]["lat"] == coord[1]
				assert graph.nodes[node]["lng"] == coord[0]

			graph.add_node(node, lat=coord[1], lng=coord[0], id=node)

		for node, coord in zip(nodes, coordinates):
			coord = coord[::-1]
			assert len(coord) == 2

			# if node in node_coordinates:
			# 	assert node_coordinates[node] == coord
			# else:
			# 	node_coordinates[node] = coord

			if previous_node is not None:
				graph.add_edge(previous_node, node)

			previous_node = node

	return graph


def get_node_coordinates(graph: networkx.Graph) -> dict[int, Coordinate]:
	"""
	Returns a mapping of nodes in the graph and their coordinates on the map.

	:param graph:
	"""

	node_coordinates = {}

	for node_id, node_data in graph.nodes.items():
		node_coordinates[node_id] = Coordinate(node_data["lat"], node_data["lng"])

	return node_coordinates


def build_kdtree(graph: networkx.Graph) -> KDTree:
	"""
	Construct a KDTree for finding the closest node to certain coordinates.

	:param graph:
	"""

	node_coordinates = get_node_coordinates(graph)
	tree = KDTree(list(node_coordinates.values()))
	return tree
