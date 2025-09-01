#!/usr/bin/env python3
#
#  network.py
"""
Data about watercourses.
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
from collections.abc import Collection
from typing import Any, Literal, TypedDict

# 3rd party
import osm2geojson  # type: ignore[import-untyped]
import requests

__all__ = ["FeatureCollection", "filter_watercourses", "query_overpass"]

# yapf: disable
# Tags to exclude from tooltip display
exclude_tags: list[str] = [
	"CEMT",
	"FIXME",
	# "HE_ref",
	# "abandoned",
	# "abandoned:lock",
	# "abandoned:usage",
	# "abandoned:waterway",
	# "access",
	# "access:conditional",
	"admin_level",
	# # "alt:lock_name",
	# # "alt_lock_name",
	# # "alt_name",
	"alt_name:2",
	"alt_name:cy",
	"alt_name:gd",
	"alt_name:pronunciation",
	# # "alt_source",
	# # "architect",
	"area",
	"automated",
	# # "bicycle",
	# "boat",
	"boat:conditional",
	"boundary",
	# # "bridge",
	# # "bridge:movable",
	# # "bridge:name",
	# # "bridge:ref",
	# # "bridge:structure",
	# # "bridge_code",
	# # "bridge_ref",
	# "canal",
	# "canal_ref",
	# # "canoe",
	# # "capacity",
	# # "centralkey",
	# # "check_date",
	# "comment",
	# "complete",
	# # "constructed",
	"covered",
	# # "created_by",
	# "culvert",
	# "cutting",
	# # "depth",
	# # "derelict",
	# "description",
	# "designation",
	# # "destination",
	# # "diameter",
	# "disused",
	# # "disused:lock",
	# # "disused:waterway",
	# # "draft",
	"ele",
	# # "embankment",
	# # "end_date",
	# # "engineer",
	# # "est_width",
	# # "fishing",
	"fixme",
	# # "flow_direction",
	# # "foot",
	# # "from",
	# # "has_riverbank",
	# # "have_riverbank",
	# # "hazard_prone",
	# # "hazard_type",
	# # "headway",
	# # "height",
	# # "height_ft",
	# # "heritage",
	# # "heritage:operator",
	# # "highway:ref",
	# # "historic",
	# # "historic:name",
	# # "historic:period",
	# # "historic:waterway",
	# # "image",
	# # "incline",
	# # "inscription",
	"intermittent",
	# # "is_in",
	# # "jetski",
	"layer",
	"left:county",
	"left:district",
	"left:parish",
	# # "length",
	# # "level",
	# # "lift",
	# # "listed_status",
	# # "loc_name",
	# # "local_ref",
	# # "location",
	# # "lock",
	"lock:height",
	"lock:leave_empty",
	# # "lock:name",
	# # "lock:name:flight",
	# # "lock:type",
	# # "lock_name",
	# # "lock_name:alt_name",
	"lock_ref",
	# # "logainm:ref",
	# # "maker",
	# # "man_made",
	# # "maritime",
	# # "material",
	# # "maxdepth",
	"maxdraft",
	"maxdraught",
	"maxheight",
	"maxheight:physical",
	"maxlength",
	"maxlength:physical",
	"maxspeed",
	"maxwidth",
	"maxwidth:physical",
	# # "mooring",
	"mooring:fee",
	# # "mooring:left",
	# # "mooring:name",
	# # "mooring:right",
	"motorboat",
	"motorboat:conditional",
	# "name",
	"name:af",
	"name:ar",
	"name:azb",
	"name:be",
	"name:be-tarask",
	"name:br",
	"name:cy",
	"name:da",
	"name:de",
	"name:en",
	"name:es",
	"name:eu",
	"name:fa",
	"name:fr",
	"name:ga",
	"name:gd",
	"name:gl",
	"name:grc",
	"name:gv",
	"name:he",
	"name:hu",
	"name:hy",
	"name:it",
	"name:ja",
	"name:kk",
	"name:ko",
	"name:kw",
	"name:lt",
	"name:mk",
	"name:nl",
	"name:nn",
	"name:no",
	"name:pa",
	"name:pl",
	"name:pronunciation",
	"name:pt",
	"name:ru",
	"name:sco",
	"name:sk",
	"name:sr",
	"name:sv",
	"name:uk",
	"name:ur",
	"name:zh",
	"name:zu",
	"name:etymology:wikidata",
	"dock",
	"wet_dock",
	# # "name_1",
	# # "narrow",
	# # "natural",
	# "navigable",
	# "not:name",
	# "note",
	# "note2",
	# "note_1",
	# "note_2",
	# "notes",
	# "official_name",
	# # "old_lock_name",
	# # "old_name",
	# # "oneway",
	# # "opening_hours",
	# "operator",
	"operator:website",
	"operator:wikidata",
	# "owner",
	# # "passing",
	# # "phone",
	# # "power",
	# # "railway:bridge:ref",
	# # "railway:track_ref",
	# # "railway:tunnel:ref",
	# # "rapids",
	# # "rapids:name",
	"ref",
	"ref:GB:nhle",
	"ref:GB:usrn",
	# # "restored",
	# # "reversible_flow",
	"right:borough",
	"right:county",
	"right:district",
	"right:parish",
	# # "sailboat",
	# # "salt",
	"seamark:harbour:category",
	"seamark:type",
	# # "seamark:bridge:category",
	# # "seamark:bridge:clearance_height",
	# # "seamark:bridge:clearance_width",
	# # "seamark:type",
	# # "seasonal",
	# # "self_service",
	# # "service",
	# # "service_times",
	# # "ship",
	"source",
	"source:boat",
	"source:geometry",
	"source:length",
	"source:listed_status",
	"source:lock",
	"source:lock_name",
	"source:maxheight",
	"source:motorboat",
	"source:name",
	"source:name:br",
	"source:old_name",
	"source:position",
	"source:ref",
	"source:waterway",
	"source:website",
	"source_ref",
	"source_ref:name",
	# # "split_from",
	# # "sport",
	# # "stagnant",
	"start_date",
	# # "state",
	# # "status",
	# # "substance",
	# # "surface",
	"swimming",
	"tidal",
	# # "to",
	# # "tourism",
	# "towpath",
	# "tunnel",
	# "tunnel:alt_name",
	# # "tunnel:length",
	# # "tunnel:name",
	# # "tunnel:ref",
	# "type",
	# "url",
	# # "usage",
	"vhf",
	# "water",
	# "waterway",
	"fishing",
	"website",
	"wheelchair",
	"whitewater:section_grade",
	"width",
	"wikidata",
	"wikimedia_commons",
	"wikipedia",
	"wikipedia:en",
	"year_of_construction:rebuilt"
	"addr:city",
	"addr:postcode",
	"addr:street",
	"capacity",
	"fee",
	"internet_access",
	"power_supply",
	"sanitary_dump_station",
	]
# yapf: enable


def query_overpass(
		query: str,
		*,
		interpreter_url: str = "https://overpass-api.de/api/interpreter",
		) -> dict[str, Any]:
	"""
	Query the Overpass API at the givern URL and return the response as GeoJSON.

	:param query:
	:param interpreter_url:
	"""

	resp = requests.post(
			interpreter_url,
			data=query,
			headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
			)
	resp.raise_for_status()

	data = osm2geojson.json2geojson(resp.json())

	return data


class FeatureCollection(TypedDict):
	"""
	Represents a GeoJSON feature collection.
	"""

	type: Literal["FeatureCollection"]
	features: list[Any]  # TODO: type


def filter_watercourses(
		data: dict[str, Any],
		*,
		tags_to_exclude: Collection[str] = (),
		ids_to_exclude: Collection[int] = (),
		) -> FeatureCollection:
	"""
	Filter watercourses in the given GeoJSON data for map display.

	:param data:
	:param tags_to_exclude: Don't include these tags in the tooltip when hovering over a watercourse.
	"""

	filtered_data: FeatureCollection = {"type": "FeatureCollection", "features": []}

	for feature in data["features"]:
		if feature["geometry"]["type"] == "Point":
			continue

		if "nodes" not in feature["properties"]:
			continue

		if feature["properties"]["id"] in ids_to_exclude:
			continue

		feature = dict(feature)
		feature["properties"] = dict(feature["properties"])

		for tag_name, tag_value in feature["properties"].get("tags", {}).items():
			feature["properties"][tag_name] = tag_value
		if "tags" in feature["properties"]:
			tags = "<br>".join(
					f"{k} = {v}" for k, v in feature["properties"]["tags"].items() if k not in tags_to_exclude
					)
			feature["properties"]["tags"] = tags
			# feature["properties"] = {"id": feature["properties"]["id"], "tags": tags, "type": feature["properties"]["type"], "nodes": feature["properties"]["nodes"]}

		filtered_data["features"].append(feature)

	return filtered_data
