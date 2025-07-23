# 3rd party
from typing import Any, Dict
import folium
from domdf_python_tools.paths import PathPlus
from folium.template import Template


class Map(folium.Map):
	_template = Template(
			"""
        {% macro header(this, kwargs) %}
            <meta name="viewport" content="width=device-width,
                initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                #{{ this.get_name() }} {
                    position: {{this.position}};
                    width: {{this.width[0]}}{{this.width[1]}};
                    height: {{this.height[0]}}{{this.height[1]}};
                    left: {{this.left[0]}}{{this.left[1]}};
                    top: {{this.top[0]}}{{this.top[1]}};
                }
                .leaflet-container { font-size: {{this.font_size}}; }
            </style>

            <style>html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            </style>

            <style>#map {
                position:absolute;
                top:0;
                bottom:0;
                right:0;
                left:0;
                }
            </style>

            <script>
                L_NO_TOUCH = {{ this.global_switches.no_touch |tojson}};
                L_DISABLE_3D = {{ this.global_switches.disable_3d|tojson }};
            </script>

        {% endmacro %}

        {% macro html(this, kwargs) %}
            <div class="folium-map" id={{ this.get_name()|tojson }} ></div>
        {% endmacro %}

        {% macro script(this, kwargs) %}
            const canvasRenderer = L.canvas({
                tolerance: 2
            });

            var {{ this.get_name() }} = L.map(
                {{ this.get_name()|tojson }},
                {
                    center: {{ this.location|tojson }},
                    crs: L.CRS.{{ this.crs }},
					renderer: canvasRenderer,
                    ...{{this.options|tojavascript}}

                }
            );

            {%- if this.control_scale %}
            L.control.scale().addTo({{ this.get_name() }});
            {%- endif %}

            {%- if this.zoom_control_position %}
            L.control.zoom( { position: {{ this.zoom_control|tojson }} } ).addTo({{ this.get_name() }});
            {%- endif %}

            {% if this.objects_to_stay_in_front %}
            function objects_in_front() {
                {%- for obj in this.objects_to_stay_in_front %}
                    {{ obj.get_name() }}.bringToFront();
                {%- endfor %}
            };
            {{ this.get_name() }}.on("overlayadd", objects_in_front);
            $(document).ready(objects_in_front);
            {%- endif %}

        {% endmacro %}
        """
			)



exclude_tags = [
		"CEMT",
		"FIXME",
		# "HE_ref",
		# "abandoned",
		# "abandoned:lock",
		# "abandoned:usage",
		# "abandoned:waterway",
		# "access",
		# "access:conditional",
		"admin_level",  # 		# "alt:lock_name",
  # 		# "alt_lock_name",
  # 		# "alt_name",
		"alt_name:2",
		"alt_name:cy",
		"alt_name:gd",
		"alt_name:pronunciation",
		# 		# "alt_source",
		# 		# "architect",
		# 		"area",  # "automated",
		#   # "bicycle",
		# 		"boat",
		"boat:conditional",
		"boundary",
		# 		# "bridge",
		# 		# "bridge:movable",
		# 		# "bridge:name",
		# 		# "bridge:ref",
		# 		# "bridge:structure",
		# 		# "bridge_code",
		# 		# "bridge_ref",
		# 		"canal",  # "canal_ref",
		#   # "canoe",
		#   # "capacity",
		#   # "centralkey",
		#   # "check_date",
		# 		"comment",  # "complete",
		#   # "constructed",
		"covered",
		#   # "created_by",
		# 		"culvert",  # "cutting",
		#   # "depth",
		#   # "derelict",
		# 		"description",  # "designation",
		#   # "destination",
		#   # "diameter",
		# 		"disused",
		# 		# "disused:lock",
		# 		# "disused:waterway",
		# 		# "draft",
		"ele",  # 		# "embankment",
  # 		# "end_date",
  # 		# "engineer",
  # 		# "est_width",
  # 		# "fishing",
		"fixme",
		# 		# "flow_direction",
		# 		# "foot",
		# 		# "from",
		# 		# "has_riverbank",
		# 		# "have_riverbank",
		# 		# "hazard_prone",
		# 		# "hazard_type",
		# 		# "headway",
		# 		# "height",
		# 		# "height_ft",
		# 		# "heritage",
		# 		# "heritage:operator",
		# 		# "highway:ref",
		# 		# "historic",
		# 		# "historic:name",
		# 		# "historic:period",
		# 		# "historic:waterway",
		# 		# "image",
		# 		# "incline",
		# 		# "inscription",
		"intermittent",  # 		# "is_in",
  # 		# "jetski",
		"layer",
		# 		# "left:county",
		# 		# "left:district",
		# 		# "left:parish",
		# 		# "length",
		# 		# "level",
		# 		# "lift",
		# 		# "listed_status",
		# 		# "loc_name",
		# 		# "local_ref",
		# 		# "location",
		# 		# "lock",
		"lock:height",
		"lock:leave_empty",
		# 		# "lock:name",
		# 		# "lock:name:flight",
		# 		# "lock:type",
		# 		# "lock_name",
		# 		# "lock_name:alt_name",
		"lock_ref",
		# 		# "logainm:ref",
		# 		# "maker",
		# 		# "man_made",
		# 		# "maritime",
		# 		# "material",
		# 		# "maxdepth",
		"maxdraft",
		"maxdraught",
		"maxheight",
		"maxheight:physical",
		"maxlength",
		"maxlength:physical",
		"maxspeed",
		"maxwidth",
		"maxwidth:physical",  # 		# "mooring",
		"mooring:fee",  # 		# "mooring:left",
  # 		# "mooring:name",
  # 		# "mooring:right",
		"motorboat",
		"motorboat:conditional",  # 		"name",
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
		# 		# "name_1",
		# 		# "narrow",
		# 		# "natural",
		# 		"navigable",  # "not:name",
		# 		"note",
		# 		"note2",
		# 		"note_1",
		# 		"note_2",
		# 		"notes",  # "official_name",
		#   # "old_lock_name",
		#   # "old_name",
		#   # "oneway",
		#   # "opening_hours",
		# 		"operator",
		"operator:website",
		"operator:wikidata",
		# 		"owner",
		# 		# "passing",
		# 		# "phone",
		# 		# "power",
		# 		# "railway:bridge:ref",
		# 		# "railway:track_ref",
		# 		# "railway:tunnel:ref",
		# 		# "rapids",
		# 		# "rapids:name",
		# 		# "ref",
		# 		# "ref:GB:nhle",
		"ref:GB:usrn",
		# 		# "restored",
		# 		# "reversible_flow",
		# 		# "right:borough",
		# 		# "right:county",
		# 		# "right:district",
		# 		# "right:parish",
		# 		# "sailboat",
		# 		# "salt",
		# 		# "seamark:bridge:category",
		# 		# "seamark:bridge:clearance_height",
		# 		# "seamark:bridge:clearance_width",
		# 		# "seamark:type",
		# 		# "seasonal",
		# 		# "self_service",
		# 		# "service",
		# 		# "service_times",
		# 		# "ship",
		"source",
		"source:boat",
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
		# 		# "split_from",
		# 		# "sport",
		# 		# "stagnant",
		# 		# "start_date",
		# 		# "state",
		# 		# "status",
		# 		# "substance",
		# 		# "surface",
		# 		# "swimming",
		"tidal",
		# 		# "to",
		# 		# "tourism",
		# 		"towpath",
		# 		"tunnel",  # "tunnel:alt_name",
		#   # "tunnel:length",
		#   # "tunnel:name",
		#   # "tunnel:ref",
		# 		"type",  # "url",
		#   # "usage",
		"vhf",  # 		"water",
  # 		"waterway",
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


def get_watercourses() -> Dict[str, Any]:
	raw_data = PathPlus("data.geojson").load_json()

	data = {"type": "FeatureCollection", "features": []}

	for feature in raw_data["features"]:
		if feature["geometry"]["type"] == "Point":
			continue

		for tag_name, tag_value in feature["properties"].get("tags", {}).items():
			feature["properties"][tag_name] = tag_value
		if "tags" in feature["properties"]:
			tags = "<br>".join(f"{k} = {v}" for k, v in feature["properties"]["tags"].items() if k not in exclude_tags)
			feature["properties"]["tags"] = tags

		data["features"].append(feature)

	# df = geopandas.GeoDataFrame.from_features(data, crs="EPSG:4326")
	# print(df.head())
	return data

