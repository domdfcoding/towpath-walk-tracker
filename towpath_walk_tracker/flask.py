# 3rd party
from domdf_python_tools.paths import PathPlus
from flask import Flask, Response, json, redirect, render_template, request
from flask_caching import Cache
from flask_compress import Compress
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from networkx import all_shortest_paths
from wtforms import DateTimeLocalField, StringField, TextAreaField, TimeField
from wtforms.validators import DataRequired

# this package
from towpath_walk_tracker.map import create_map
from towpath_walk_tracker.network import build_kdtree, build_network, get_node_coordinates
from towpath_walk_tracker.watercourses import exclude_tags, filter_watercourses

__all__ = ["add_walk", "leaflet_map", "watercourses_geojson"]

app = Flask(__name__)

app.config["COMPRESS_ALGORITHM"] = ["gzip"]
app.config["COMPRESS_MIMETYPES"] = [
		"text/html",
		"text/css",
		"text/plain",
		"application/javascript",
		"application/json",
		"application/manifest+json",
		"application/vnd.api+json",
		"application/x-font-ttf",
		"application/x-font-opentype",
		"application/x-font-truetype",
		"image/svg+xml",
		"image/x-icon",
		"image/vnd.microsoft.icon",
		"font/ttf",
		"font/otf",
		"font/opentype",
		"application/geo+json",
		]
app.config["CACHE_TYPE"] = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 300
app.config["SECRET_KEY"] = "1234"

Compress(app)
cache = Cache(app)
csrf = CSRFProtect(app)


@app.route("/watercourses.geojson")
@cache.cached()
def watercourses_geojson():
	raw_data = PathPlus("data.geojson").load_json()
	data = filter_watercourses(raw_data, tags_to_exclude=exclude_tags)
	# TODO: cache
	resp = Response(json.dumps(data), 200, headers={"Content-Type": "application/geo+json"})
	return resp


@app.route("/map")
@cache.cached()
def leaflet_map():
	# zoom_level = int(request.args.get("zoom", 6))
	# lat = float(request.args.get("lat", 55))
	# lng = float(request.args.get("lng", -2))
	# print(zoom_level, lat, lng)
	m = create_map("http://localhost:5000/watercourses.geojson")  #, (lat, lng), zoom_level)
	return m.get_root().render()


@app.route("/add", methods=["POST"])
@csrf.exempt
def add_walk():
	start, end = request.get_json()
	print(f"Create walk from {tuple(start)} to {tuple(end)}")

	raw_data = PathPlus("data.geojson").load_json()
	watercourses = filter_watercourses(raw_data, tags_to_exclude=exclude_tags)

	G = build_network(watercourses)
	tree = build_kdtree(G)
	print(tree.query(start))
	print(tree.query(end))

	tree = build_kdtree(G)
	# start_coord = (52.4153403, -1.510088399999991)
	# end_coord = (52.44545279535703, -1.4313163612182034)
	start_coord = tuple(start)
	end_coord = tuple(end)

	print(start_coord)
	print(end_coord)

	start_node_dist, start_idx = tree.query(start_coord)
	end_node_dist, end_idx = tree.query(end_coord)

	nckl = list(get_node_coordinates(G).keys())
	start_node = nckl[start_idx]
	end_node = nckl[end_idx]

	print(G.nodes[start_node])
	print(G.nodes[end_node])

	path = next(all_shortest_paths(G, start_node, end_node))

	coords = []
	for node in path:
		coords.append((G.nodes[node]["lat"], G.nodes[node]["lng"]))

	return coords


class WalkForm(FlaskForm):
	start = DateTimeLocalField("Start")  # , validators=[DataRequired()])
	duration = TimeField("Duration")  # , validators=[DataRequired()])
	start_point = StringField("Start Point")  # , validators=[DataRequired()])
	end_point = StringField("End Point")  # , validators=[DataRequired()])
	notes = TextAreaField("Notes")  # , validators=[DataRequired()])


@app.route("/walk", methods=["GET", "POST"])
def walk():
	form = WalkForm()
	if form.validate_on_submit():
		print(form.data)
		return redirect("/success")
	return render_template("walk_form.jinja2", form=form)
