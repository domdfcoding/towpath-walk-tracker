#!/usr/bin/env python3
#
#  models.py
"""
Database models.
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
import datetime
from typing import TYPE_CHECKING, List, Tuple, Type

# 3rd party
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped  # nodep

# this package
from towpath_walk_tracker.forms import PointForm, WalkForm
from towpath_walk_tracker.route import Route

db = SQLAlchemy()

if TYPE_CHECKING:
	# 3rd party
	from flask_sqlalchemy.model import Model
else:
	Model = db.Model

__all__ = ["Node", "Point", "Walk"]

# Table associating route nodes with a walk.
association_table = db.Table(
		"association_table",
		db.metadata,
		db.Column("walk_id", db.ForeignKey("walks.id")),
		db.Column("node_id", db.ForeignKey("nodes.id")),
		)


class Walk(Model):
	"""
	Database model for a walk.
	"""

	__tablename__ = "walks"

	id: Mapped[int] = db.mapped_column(primary_key=True)
	title = db.Column(db.String(200), nullable=False)
	start = db.Column(db.DateTime, nullable=True)
	duration = db.Column(db.Integer, nullable=False, default=0)
	notes = db.Column(db.Text, nullable=False)
	points: Mapped[List["Point"]] = db.relationship(back_populates="walk")  # type: ignore[assignment]
	route: Mapped[List["Node"]] = db.relationship(secondary=association_table)  # type: ignore[assignment]

	# user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

	def __repr__(self) -> str:
		return f"<Walk({self.title})>"

	def get_route_coords(self) -> List[Tuple[float, float]]:
		"""
		Returns the route as a list of lat/lng coordinates.
		"""

		coords = []
		for node in self.route:
			coords.append((node.latitude, node.longitude))

		return coords

	def get_route(self) -> Route:
		"""
		Returns the route.
		"""

		return Route.from_db(self.route)

	@classmethod
	def from_form(cls: Type["Walk"], form: WalkForm) -> "Walk":
		"""
		Construct a walk model from a walk form.

		:param form:
		"""

		title: str = form.title.data  # type: ignore[attr-defined]
		start: datetime.datetime = form.start.data  # type: ignore[attr-defined]
		duration_hours, duration_mins = map(int, form.duration.data.split(':'))  # type: ignore[attr-defined]
		duration: int = duration_hours * 60 + duration_mins
		notes: str = form.notes.data  # type: ignore[attr-defined]

		walk = cls(title=title, start=start, duration=duration, notes=notes)  # type: ignore[call-arg]

		points = []
		point_form: PointForm
		for point_form in form.points.entries:  # type: ignore[attr-defined]
			if point_form.enabled.data:  # type: ignore[attr-defined]
				latitude = point_form.latitude.data  # type: ignore[attr-defined]
				longitude = point_form.longitude.data  # type: ignore[attr-defined]

				assert latitude is not None
				assert longitude is not None

				point = Point(latitude=latitude, longitude=longitude, walk=walk)  # type: ignore[call-arg]
				points.append(point)

		route = Route.from_points([(point.latitude, point.longitude) for point in points])

		existing_nodes = {node.id: node for node in Node.query.where(Node.id.in_(route.nodes))}

		nodes = []  # Nodes in the walk, in order
		new_nodes_for_walk = []  # Nodes in the walk we have to create

		for node_id in route.nodes:
			if node_id in existing_nodes:
				node = existing_nodes[node_id]
			else:
				node_lat, node_lng = route.node_coordinates[node_id]
				node = Node(id=node_id, latitude=node_lat, longitude=node_lng)
				new_nodes_for_walk.append(node)

			nodes.append(node)

		walk.route = nodes

		db.session.add_all([walk])
		db.session.add_all(points)
		db.session.add_all(new_nodes_for_walk)

		db.session.commit()

		return walk


class Point(Model):
	"""
	Model for a point on a walk.
	"""

	__tablename__ = "points"

	id = db.Column(db.Integer, primary_key=True)
	walk_id: Mapped[int] = db.mapped_column(db.ForeignKey("walks.id"))
	walk: Mapped[Walk] = db.relationship(back_populates="points")  # type: ignore[assignment]
	latitude = db.Column(db.Float, nullable=False)
	longitude = db.Column(db.Float, nullable=False)

	def __repr__(self) -> str:
		return f"<Point({self.latitude}, {self.longitude})>"


class Node(Model):
	"""
	Model for an OpenStreetMap node.
	"""

	__tablename__ = "nodes"

	id: Mapped[int] = db.mapped_column(primary_key=True)
	latitude = db.Column(db.Float, nullable=False)
	longitude = db.Column(db.Float, nullable=False)

	def __repr__(self) -> str:
		return f"<Node({self.id}, {self.latitude}, {self.longitude})>"
