#!/usr/bin/env python3
#
#  forms.py
"""
WTForms forms.
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
import itertools
from collections.abc import Iterable, Sequence
from typing import Any, Callable, Optional, Union

# 3rd party
from flask_wtf import FlaskForm  # type: ignore[import-untyped]
from wtforms import (
		DateTimeLocalField,
		Field,
		FieldList,
		FloatField,
		Form,
		FormField,
		IntegerField,
		StringField,
		TextAreaField,
		validators
		)
from wtforms.validators import DataRequired, InputRequired, NumberRange
from wtforms.widgets import ColorInput, NumberInput

__all__ = ["FieldListMinRequired", "PointForm", "WalkForm"]


class PointForm(FlaskForm):
	"""
	Sub-form for a point along a walk.
	"""

	latitude = FloatField(
			"latitude",
			validators=[InputRequired(), NumberRange(min=-180, max=180, message="Invalid coordinate")],
			)
	longitude = FloatField(
			"longitude",
			validators=[InputRequired(), NumberRange(min=-180, max=180, message="Invalid coordinate")],
			)
	point_id = StringField("point_id", default='')
	enabled = IntegerField(
			"Enabled",
			validators=[InputRequired(), NumberRange(min=0, max=1, message="Invalid Value")],
			default=0,
			)


class FieldListMinRequired(FieldList):
	"""
	Custom WTForms ``FieldList`` requiring a minimum number of entries.

	No other validators may be used.
	"""

	def __init__(
			self,
			unbound_field: Field,
			label: Optional[str] = None,
			min_required_entries: int = 0,
			min_entries: int = 0,
			max_entries: Optional[int] = None,
			separator: str = '-',
			default: Union[Iterable[Any], Callable[[], Iterable[Any]]] = (),
			**kwargs,
			):
		super().__init__(
				unbound_field=unbound_field,
				label=label,
				validators=[DataRequired()],
				min_entries=min_entries,
				max_entries=max_entries,
				separator=separator,
				default=default,
				**kwargs
				)
		self.min_required_entries = min_required_entries

	def validate(  # type: ignore[override]  # noqa: D102
		self,
		form: Form,
		extra_validators: Sequence[Callable] = (),
		) -> bool:

		num_valid = 0
		self.errors = []

		# Run validators on all entries within
		for subfield in self.entries:
			if subfield.validate(form):
				num_valid += 1

		if num_valid >= self.min_required_entries:
			self.errors = []
		else:
			self.errors = [{
					"id": [f"A minimum of {self.min_required_entries} entries are required; got {num_valid}."]
					}]

		chain = itertools.chain(self.validators, extra_validators)  # type: ignore[arg-type]
		self._run_validation_chain(form, chain)  # type: ignore[attr-defined]

		return len(self.errors) == 0


class WalkForm(FlaskForm):
	"""
	Form for information about a walk.
	"""

	points = FieldListMinRequired(FormField(PointForm), min_required_entries=2, min_entries=50)
	title = StringField("Title", [validators.length(max=200)], default='')  # , DataRequired()])
	start = DateTimeLocalField("Start")  # , validators=[DataRequired()])
	duration_hrs = IntegerField('h', default=0, widget=NumberInput(min=0), validators=[NumberRange(min=0)])
	duration_mins = IntegerField(
			'm',
			default=0,
			widget=NumberInput(min=0, max=59),
			validators=[NumberRange(min=0, max=59)],
			)
	notes = TextAreaField("Notes", default='')  # , validators=[DataRequired()])
	colour = StringField(widget=ColorInput(), default="#139c25")
