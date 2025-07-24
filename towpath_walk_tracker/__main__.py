# this package
from towpath_walk_tracker.flask import app

__all__ = ["hello_world"]


@app.route('/')
def hello_world():
	return "<p>Hello, World!</p>"


if __name__ == "__main__":
	app.run(debug=True)
