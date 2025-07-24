# stdlib
from typing import Any, Dict, Tuple

# 3rd party
import networkx
from scipy.spatial import KDTree

__all__ = ["build_kdtree", "build_network", "get_node_coordinates"]


def build_network(watercourses: Dict[str, Any]):

	graph = networkx.Graph()

	for wc in watercourses["features"]:
		if wc["properties"]["type"] != "way":
			continue

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


def get_node_coordinates(graph: networkx.Graph) -> Dict[int, Tuple[float, float]]:
	node_coordinates = {}

	for node_id, node_data in graph.nodes.items():
		node_coordinates[node_id] = (node_data["lat"], node_data["lng"])

	return node_coordinates


def build_kdtree(graph: networkx.Graph) -> KDTree:
	node_coordinates = get_node_coordinates(graph)
	tree = KDTree(list(node_coordinates.values()))
	return tree
