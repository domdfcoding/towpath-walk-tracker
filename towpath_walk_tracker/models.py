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
	colour = Column(String(6), nullable=False)  # hex colour
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

		:param db:
		:param form:
		"""

		assert form.title.data is not None
		title: str = cast(str, form.title.data)
		start: datetime.datetime = cast(datetime.datetime, form.start.data)
		duration_hours = int(cast(str, form.duration_hrs.data))
		duration_mins = int(cast(str, form.duration_mins.data))
		duration: int = duration_hours * 60 + duration_mins
		notes: str = cast(str, form.notes.data)
		colour: str = cast(str, form.colour.data)[1:]

		walk = cls(title=title, start=start, duration=duration, notes=notes, colour=colour)

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

		nodes, new_nodes = cls._calculate_route(db, points)

		walk.route = nodes

		db.session.add(walk)
		db.session.add_all(points)
		db.session.add_all(new_nodes)

		db.session.commit()

		return walk

	@staticmethod
	def _calculate_route(db: SQLAlchemy, points: List["Point"]) -> Tuple[List["Node"], List["Node"]]:
		# Recalculate route
		coords = [(cast(float, point.latitude), cast(float, point.longitude)) for point in points]
		route = Route.from_points(coords)

		existing_nodes = {node.id: node for node in db.session.query(Node).where(Node.id.in_(route.nodes))}

		nodes = []  # Nodes in the walk, in order
		new_nodes = []  # Nodes in the walk we have to create

		for node_id in route.nodes:
			if node_id in existing_nodes:
				node = existing_nodes[node_id]
			else:
				node_lat, node_lng = route.node_coordinates[node_id]
				node = Node(id=node_id, latitude=node_lat, longitude=node_lng)
				new_nodes.append(node)

			nodes.append(node)

		return nodes, new_nodes

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
				"route": route,
				"colour": '#' + self.colour,
				}

	def update_from_form(self, db: SQLAlchemy, form: WalkForm) -> None:
		"""
		Update the walk model from a walk form.

		:param db:
		:param form:
		"""

		assert form.title.data is not None
		self.title = cast(Column[str], form.title.data)
		self.start = cast(Column[datetime.datetime], form.start.data)
		duration_hours = int(cast(str, form.duration_hrs.data))
		duration_mins = int(cast(str, form.duration_mins.data))
		self.duration = cast(Column[int], duration_hours * 60 + duration_mins)
		self.notes = cast(Column[str], form.notes.data)
		self.colour: str = cast(str, form.colour.data)[1:]

		new_points = []
		points = []
		point_form: PointForm
		points_have_changed: bool = False
		for point_form in form.points.entries:
			if point_form.enabled.data:
				latitude = point_form.latitude.data
				longitude = point_form.longitude.data

				assert latitude is not None
				assert longitude is not None

				if point_form.point_id.data:
					point_id = int(point_form.point_id.data)
					point = db.session.query(Point).filter_by(id=point_id).first()

					if not point:
						raise ValueError(f"No existing point with ID {point_id}")
					if point.walk != self:
						raise ValueError("Editing a point that does not belong to this walk")

					if point.latitude != latitude or point.longitude != longitude:
						point.latitude = cast(Column[float], latitude)
						point.longitude = cast(Column[float], longitude)
						points_have_changed = True

					points.append(point)

				else:
					points_have_changed = True
					point = Point(latitude=latitude, longitude=longitude, walk=self)
					new_points.append(point)
					points.append(point)

		db.session.add_all(new_points)

		if points_have_changed:
			# Recalculate route
			nodes, new_nodes = self._calculate_route(db, points)
			self.route = nodes
			db.session.add_all(new_nodes)

		db.session.commit()


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

	def to_json(self) -> Dict[str, Any]:
		"""
		Return a JSON representation of the point.
		"""

		return {
				"latitude": self.latitude,
				"longitude": self.longitude,
				"id": self.id,
				}


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

	def to_json(self) -> Dict[str, Any]:
		"""
		Return a JSON representation of the node.
		"""

		return {
				"latitude": self.latitude,
				"longitude": self.longitude,
				"id": self.id,
				}
