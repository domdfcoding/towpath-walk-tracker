# stdlib
from typing import Any, Dict

# 3rd party
from domdf_python_tools.paths import PathPlus

# this package
from towpath_walk_tracker.map import create_map
from towpath_walk_tracker.watercourses import exclude_tags, filter_watercourses


def get_watercourses() -> Dict[str, Any]:
	raw_data = PathPlus("data.geojson").load_json()

	data = filter_watercourses(raw_data, tags_to_exclude=exclude_tags)

	# df = geopandas.GeoDataFrame.from_features(data, crs="EPSG:4326")
	# print(df.head())
	return data


data = get_watercourses()
PathPlus("watercourses.geojson").dump_json(data)

m = create_map("watercourses.geojson")
m.save("map.html")
