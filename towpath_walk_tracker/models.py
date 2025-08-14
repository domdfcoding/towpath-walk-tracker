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
from typing import Any, Dict, List, Tuple, Type, cast

# 3rd party
from flask_sqlalchemy_lite import SQLAlchemy
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# this package
from towpath_walk_tracker.forms import PointForm, WalkForm
from towpath_walk_tracker.route import Route

__all__ = ["Model", "Node", "Point", "Walk"]


class Model(DeclarativeBase):
	"""
	Base class for all models.
	"""


# Table associating route nodes with a walk.
association_table = Table(
		"association_table",
		Model.metadata,
		Column("walk_id", ForeignKey("walks.id")),
		Column("node_id", ForeignKey("nodes.id")),
		)


class Walk(Model):
	"""
	Database model for a walk.
	"""

	__tablename__ = "walks"

	id: Mapped[int] = mapped_column(primary_key=True)
	title = Column(String(200), nullable=False)
	start = Column(DateTime, nullable=True)
	duration = Column(Integer, nullable=False, default=0)
	notes = Column(Text, nullable=False)
	# colour = Column(String(6), nullable=False)  # hex colour
	points: Mapped[List["Point"]] = relationship(back_populates="walk")
	route: Mapped[List["Node"]] = relationship(secondary=association_table)

	# user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

	def __repr__(self) -> str:
		return f"<Walk({self.title})>"

	def get_route_coords(self) -> List[Tuple[float, float]]:
		"""
		Returns the route as a list of lat/lng coordinates.
		"""

		coords: List[Tuple[float, float]] = []
		for node in self.route:
			coords.append((cast(float, node.latitude), cast(float, node.longitude)))

		return coords

	def get_route(self) -> Route:
		"""
		Returns the route.
		"""

		return Route.from_db(self.route)

	@classmethod
	def from_form(cls: Type["Walk"], db: SQLAlchemy, form: WalkForm) -> "Walk":
		"""
		Construct a walk model from a walk form.

		:param form:
		"""

		assert form.title.data is not None
		title: str = cast(str, form.title.data)
		start: datetime.datetime = cast(datetime.datetime, form.start.data)
		duration_hours, duration_mins = map(int, cast(str, form.duration.data).split(':'))
		duration: int = duration_hours * 60 + duration_mins
		notes: str = cast(str, form.notes.data)

		walk = cls(title=title, start=start, duration=duration, notes=notes)

		points = []
		point_form: PointForm
		for point_form in form.points.entries:
			if point_form.enabled.data:
				latitude = point_form.latitude.data
				longitude = point_form.longitude.data

				assert latitude is not None
				assert longitude is not None

				point = Point(latitude=latitude, longitude=longitude, walk=walk)
				points.append(point)

		coords = [(cast(float, point.latitude), cast(float, point.longitude)) for point in points]
		route = Route.from_points(coords)

		existing_nodes = {node.id: node for node in db.session.query(Node).where(Node.id.in_(route.nodes))}

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

	def to_json(self) -> Dict[str, Any]:
		"""
		Return a JSON representation of the walk.
		"""

		points = []
		for point in self.points:
			points.append({
					"latitude": point.latitude,
					"longitude": point.longitude,
					"id": point.id,
					})

		route = []
		for node in self.route:
			route.append({
					"latitude": node.latitude,
					"longitude": node.longitude,
					"id": node.id,
					})

		return {
				"title": self.title,
				"start": self.start,
				"duration": self.duration,
				"notes": self.notes,
				"id": self.id,
				"points": points,
				"route": route,  # "colour": "#" + "ffa600",  # walk.colour,
				"colour": '#' + "139c25",  # walk.colour,
				}


class Point(Model):
	"""
	Model for a point on a walk.
	"""

	__tablename__ = "points"

	id = Column(Integer, primary_key=True)
	walk_id: Mapped[int] = mapped_column(ForeignKey("walks.id"))
	walk: Mapped[Walk] = relationship(back_populates="points")
	latitude = Column(Float, nullable=False)
	longitude = Column(Float, nullable=False)

	def __repr__(self) -> str:
		return f"<Point({self.latitude}, {self.longitude})>"


class Node(Model):
	"""
	Model for an OpenStreetMap node.
	"""

	__tablename__ = "nodes"

	id: Mapped[int] = mapped_column(primary_key=True)
	latitude = Column(Float, nullable=False)
	longitude = Column(Float, nullable=False)

	def __repr__(self) -> str:
		return f"<Node({self.id}, {self.latitude}, {self.longitude})>"
