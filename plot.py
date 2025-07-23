# 3rd party
import folium
import geopandas
from domdf_python_tools.paths import PathPlus
from folium.template import Template
from prepare_map import Map, get_watercourses



class CustomCode(folium.MacroElement):
	"""
	When one clicks on a Map that contains a LatLngPopup,
	a popup is shown that displays the latitude and longitude of the pointer.

	"""

	_template = Template(
		"""
			{% macro script(this, kwargs) %}
				// var {{this.get_name()}} = L.popup();
				function latLngPop(e) {
					// {{this.get_name()}}
					//     .setLatLng(e.latlng)
					//     .setContent("Latitude: " + e.latlng.lat.toFixed(4) +
					//                 "<br>Longitude: " + e.latlng.lng.toFixed(4))
					//     .openOn({{this._parent.get_name()}});
					
					console.log("Latitude: " + e.latlng.lat.toFixed(4));
					console.log("Longitude: " + e.latlng.lng.toFixed(4));
				
				
					const coordinates_array = geo_json_watercourses.getLayers().map(l => l.feature.geometry.coordinates)
						 console.log(coordinates_array);
					let closest_latlng = L.GeometryUtil.closest(map_canal_towpath_walking, coordinates_array, [e.latlng.lng, e.latlng.lat])
					console.log("Closest Latitude: " + closest_latlng.lat.toFixed(4));
					console.log("Closest Longitude: " + closest_latlng.lng.toFixed(4));
					markerClosestPolyline1 = L.marker(closest_latlng).addTo(map_canal_towpath_walking).bindPopup('Closest point on polyline1');
						 
					// const eventLayerPoint = {{ this._parent.get_name() }}.latLngToLayerPoint({{ this._parent.get_name() }}.containerPointToLatLng(event.containerPoint));
					// var nearestPoint = {{ this._parent.get_name() }}.layerPointToLatLng(
					// this.trackLine.polyLine.closestLayerPoint(eventLayerPoint));
					// this.trackTracing.dot.setLatLng(this.trackTracing.nearestPoint);
					// this.trackTracing.trace.setLatLngs([event.latlng, this.trackTracing.nearestPoint]);
						 
					L.marker(
						//e.latlng,
						[closest_latlng.lng, closest_latlng.lat],
						{}
					).addTo({{ this._parent.get_name() }});
				}

				{{this._parent.get_name()}}.on('click', latLngPop);
			{% endmacro %}
			"""
	)  # noqa

	def __init__(self):
		super().__init__()
		self._name = "CustomCode"


def create_folium_map():
	data = get_watercourses()
	PathPlus("watercourses.geojson").dump_json(data)

	m = Map([55, -2], zoom_start=6, control_scale=True)
	m._id = "canal_towpath_walking"

	tooltip = folium.GeoJsonTooltip(
			fields=["id", "tags"],
			aliases=["ID", ''],
			# aliases=["State:", "2015 Median Income(USD):", "Median % Change:"],
			localize=True,
			sticky=True,
			labels=True,
			style="""
			background-color: #F0EFEF;
			border: 2px solid black;
			border-radius: 3px;
			box-shadow: 3px;
			font-size: 12pt;
		""",
			max_width=800,
			)

	g = folium.GeoJson(
			# data,
			"watercourses.geojson",
			embed=False,
			tooltip=tooltip,
			).add_to(m)
	g._id = "watercourses"

	folium.LatLngPopup().add_to(m)
	CustomCode().add_to(m)
	m.add_js_link("leaflet.geometryutil", "leaflet.geometryutil.js")
	m.save("map.html")

create_folium_map()
