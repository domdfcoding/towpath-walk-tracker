/* From https://github.com/bbecquet/Leaflet.PolylineDecorator
Copyright (c) 2013 Benjamin Becquet
MIT Licence
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined'
		? factory(require('leaflet'))
		: typeof define === 'function' && define.amd
			? define(['leaflet'], factory)
			: (factory(global.L));
}(this, function (L$1) {
	'use strict';

	L$1 = L$1 && L$1.hasOwnProperty('default') ? L$1.default : L$1;

	// functional re-impl of L.Point.distanceTo,
	// with no dependency on Leaflet for easier testing
	function pointDistance (ptA, ptB) {
		const x = ptB.x - ptA.x;
		const y = ptB.y - ptA.y;
		return Math.sqrt(x * x + y * y);
	}

	const computeSegmentHeading = function computeSegmentHeading (a, b) {
		return (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90 + 360) % 360;
	};

	const asRatioToPathLength = function asRatioToPathLength (_ref, totalPathLength) {
		const value = _ref.value;
		const isInPixels = _ref.isInPixels;
		return isInPixels ? value / totalPathLength : value;
	};

	function parseRelativeOrAbsoluteValue (value) {
		if (typeof value === 'string' && value.indexOf('%') !== -1) {
			return {
				value: parseFloat(value) / 100,
				isInPixels: false
			};
		}
		const parsedValue = value ? parseFloat(value) : 0;
		return {
			value: parsedValue,
			isInPixels: parsedValue > 0
		};
	}

	const pointsEqual = function pointsEqual (a, b) {
		return a.x === b.x && a.y === b.y;
	};

	function pointsToSegments (pts) {
		return pts.reduce(function (segments, b, idx, points) {
			// this test skips same adjacent points
			if (idx > 0 && !pointsEqual(b, points[idx - 1])) {
				const a = points[idx - 1];
				const distA = segments.length > 0 ? segments[segments.length - 1].distB : 0;
				const distAB = pointDistance(a, b);
				segments.push({
					a,
					b,
					distA,
					distB: distA + distAB,
					heading: computeSegmentHeading(a, b)
				});
			}
			return segments;
		}, []);
	}

	function projectPatternOnPointPath (pts, pattern) {
		// 1. split the path into segment infos
		const segments = pointsToSegments(pts);
		const nbSegments = segments.length;
		if (nbSegments === 0) {
			return [];
		}

		const totalPathLength = segments[nbSegments - 1].distB;

		const offset = asRatioToPathLength(pattern.offset, totalPathLength);
		const endOffset = asRatioToPathLength(pattern.endOffset, totalPathLength);
		const repeat = asRatioToPathLength(pattern.repeat, totalPathLength);

		const repeatIntervalPixels = totalPathLength * repeat;
		const startOffsetPixels = offset > 0 ? totalPathLength * offset : 0;
		const endOffsetPixels = endOffset > 0 ? totalPathLength * endOffset : 0;

		// 2. generate the positions of the pattern as offsets from the path start
		const positionOffsets = [];
		let positionOffset = startOffsetPixels;
		do {
			positionOffsets.push(positionOffset);
			positionOffset += repeatIntervalPixels;
		} while (repeatIntervalPixels > 0 && positionOffset < totalPathLength - endOffsetPixels);

		// 3. projects offsets to segments
		let segmentIndex = 0;
		let segment = segments[0];
		return positionOffsets.map(function (positionOffset) {
			// find the segment matching the offset,
			// starting from the previous one as offsets are ordered
			while (positionOffset > segment.distB && segmentIndex < nbSegments - 1) {
				segmentIndex++;
				segment = segments[segmentIndex];
			}

			const segmentRatio = (positionOffset - segment.distA) / (segment.distB - segment.distA);
			return {
				pt: interpolateBetweenPoints(segment.a, segment.b, segmentRatio),
				heading: segment.heading
			};
		});
	}

	/**
* Finds the point which lies on the segment defined by points A and B,
* at the given ratio of the distance from A to B, by linear interpolation.
*/
	function interpolateBetweenPoints (ptA, ptB, ratio) {
		if (ptB.x !== ptA.x) {
			return {
				x: ptA.x + ratio * (ptB.x - ptA.x),
				y: ptA.y + ratio * (ptB.y - ptA.y)
			};
		}
		// special case where points lie on the same vertical axis
		return {
			x: ptA.x,
			y: ptA.y + (ptB.y - ptA.y) * ratio
		};
	}

	(function () {
		// save these original methods before they are overwritten
		const proto_initIcon = L.Marker.prototype._initIcon;
		const proto_setPos = L.Marker.prototype._setPos;

		const oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

		L.Marker.addInitHook(function () {
			const iconOptions = this.options.icon && this.options.icon.options;
			let iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
			if (iconAnchor) {
				iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
			}
			this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom';
			this.options.rotationAngle = this.options.rotationAngle || 0;

			// Ensure marker keeps rotated during dragging
			this.on('drag', function (e) { e.target._applyRotation(); });
		});

		L.Marker.include({
			_initIcon: function () {
				proto_initIcon.call(this);
			},

			_setPos: function (pos) {
				proto_setPos.call(this, pos);
				this._applyRotation();
			},

			_applyRotation: function () {
				if (this.options.rotationAngle) {
					this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin;

					if (oldIE) {
						// for IE 9, use the 2D rotation
						this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
					} else {
						// for modern browsers, prefer the 3D accelerated version
						this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
					}
				}
			},

			setRotationAngle: function (angle) {
				this.options.rotationAngle = angle;
				this.update();
				return this;
			},

			setRotationOrigin: function (origin) {
				this.options.rotationOrigin = origin;
				this.update();
				return this;
			}
		});
	})();

	L$1.Symbol = L$1.Symbol || {};

	/**
* A simple dash symbol, drawn as a Polyline.
* Can also be used for dots, if 'pixelSize' option is given the 0 value.
*/
	L$1.Symbol.Dash = L$1.Class.extend({
		options: {
			pixelSize: 10,
			pathOptions: {}
		},

		initialize: function initialize (options) {
			L$1.Util.setOptions(this, options);
			this.options.pathOptions.clickable = false;
		},

		buildSymbol: function buildSymbol (dirPoint, latLngs, map, index, total) {
			const opts = this.options;
			const d2r = Math.PI / 180;

			// for a dot, nothing more to compute
			if (opts.pixelSize <= 1) {
				return L$1.polyline([dirPoint.latLng, dirPoint.latLng], opts.pathOptions);
			}

			const midPoint = map.project(dirPoint.latLng);
			const angle = -(dirPoint.heading - 90) * d2r;
			const a = L$1.point(midPoint.x + opts.pixelSize * Math.cos(angle + Math.PI) / 2, midPoint.y + opts.pixelSize * Math.sin(angle) / 2);
			// compute second point by central symmetry to avoid unecessary cos/sin
			const b = midPoint.add(midPoint.subtract(a));
			return L$1.polyline([map.unproject(a), map.unproject(b)], opts.pathOptions);
		}
	});

	L$1.Symbol.dash = function (options) {
		return new L$1.Symbol.Dash(options);
	};

	L$1.Symbol.ArrowHead = L$1.Class.extend({
		options: {
			polygon: true,
			pixelSize: 10,
			headAngle: 60,
			pathOptions: {
				stroke: false,
				weight: 2
			}
		},

		initialize: function initialize (options) {
			L$1.Util.setOptions(this, options);
			this.options.pathOptions.clickable = false;
		},

		buildSymbol: function buildSymbol (dirPoint, latLngs, map, index, total) {
			return this.options.polygon ? L$1.polygon(this._buildArrowPath(dirPoint, map), this.options.pathOptions) : L$1.polyline(this._buildArrowPath(dirPoint, map), this.options.pathOptions);
		},

		_buildArrowPath: function _buildArrowPath (dirPoint, map) {
			const d2r = Math.PI / 180;
			const tipPoint = map.project(dirPoint.latLng);
			const direction = -(dirPoint.heading - 90) * d2r;
			const radianArrowAngle = this.options.headAngle / 2 * d2r;

			const headAngle1 = direction + radianArrowAngle;
			const headAngle2 = direction - radianArrowAngle;
			const arrowHead1 = L$1.point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle1), tipPoint.y + this.options.pixelSize * Math.sin(headAngle1));
			const arrowHead2 = L$1.point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle2), tipPoint.y + this.options.pixelSize * Math.sin(headAngle2));

			return [map.unproject(arrowHead1), dirPoint.latLng, map.unproject(arrowHead2)];
		}
	});

	L$1.Symbol.arrowHead = function (options) {
		return new L$1.Symbol.ArrowHead(options);
	};

	L$1.Symbol.Marker = L$1.Class.extend({
		options: {
			markerOptions: {},
			rotate: false
		},

		initialize: function initialize (options) {
			L$1.Util.setOptions(this, options);
			this.options.markerOptions.clickable = false;
			this.options.markerOptions.draggable = false;
		},

		buildSymbol: function buildSymbol (directionPoint, latLngs, map, index, total) {
			if (this.options.rotate) {
				this.options.markerOptions.rotationAngle = directionPoint.heading + (this.options.angleCorrection || 0);
			}
			return L$1.marker(directionPoint.latLng, this.options.markerOptions);
		}
	});

	L$1.Symbol.marker = function (options) {
		return new L$1.Symbol.Marker(options);
	};

	const isCoord = function isCoord (c) {
		return c instanceof L$1.LatLng || Array.isArray(c) && c.length === 2 && typeof c[0] === 'number';
	};

	const isCoordArray = function isCoordArray (ll) {
		return Array.isArray(ll) && isCoord(ll[0]);
	};

	L$1.PolylineDecorator = L$1.FeatureGroup.extend({
		options: {
			patterns: []
		},

		initialize: function initialize (paths, options) {
			L$1.FeatureGroup.prototype.initialize.call(this);
			L$1.Util.setOptions(this, options);
			this._map = null;
			this._paths = this._initPaths(paths);
			this._bounds = this._initBounds();
			this._patterns = this._initPatterns(this.options.patterns);
		},

		/**
    * Deals with all the different cases. input can be one of these types:
    * array of LatLng, array of 2-number arrays, Polyline, Polygon,
    * array of one of the previous.
    */
		_initPaths: function _initPaths (input, isPolygon) {
			const _this = this;

			if (isCoordArray(input)) {
				// Leaflet Polygons don't need the first point to be repeated, but we do
				const coords = isPolygon ? input.concat([input[0]]) : input;
				return [coords];
			}
			if (input instanceof L$1.Polyline) {
				// we need some recursivity to support multi-poly*
				return this._initPaths(input.getLatLngs(), input instanceof L$1.Polygon);
			}
			if (Array.isArray(input)) {
				// flatten everything, we just need coordinate lists to apply patterns
				return input.reduce(function (flatArray, p) {
					return flatArray.concat(_this._initPaths(p, isPolygon));
				}, []);
			}
			return [];
		},

		// parse pattern definitions and precompute some values
		_initPatterns: function _initPatterns (patternDefs) {
			return patternDefs.map(this._parsePatternDef);
		},

		/**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
		setPatterns: function setPatterns (patterns) {
			this.options.patterns = patterns;
			this._patterns = this._initPatterns(this.options.patterns);
			this.redraw();
		},

		/**
    * Changes the patterns used by this decorator
    * and redraws the new one.
    */
		setPaths: function setPaths (paths) {
			this._paths = this._initPaths(paths);
			this._bounds = this._initBounds();
			this.redraw();
		},

		/**
    * Parse the pattern definition
    */
		_parsePatternDef: function _parsePatternDef (patternDef, latLngs) {
			return {
				symbolFactory: patternDef.symbol,
				// Parse offset and repeat values, managing the two cases:
				// absolute (in pixels) or relative (in percentage of the polyline length)
				offset: parseRelativeOrAbsoluteValue(patternDef.offset),
				endOffset: parseRelativeOrAbsoluteValue(patternDef.endOffset),
				repeat: parseRelativeOrAbsoluteValue(patternDef.repeat)
			};
		},

		onAdd: function onAdd (map) {
			this._map = map;
			this._draw();
			this._map.on('moveend', this.redraw, this);
		},

		onRemove: function onRemove (map) {
			this._map.off('moveend', this.redraw, this);
			this._map = null;
			L$1.FeatureGroup.prototype.onRemove.call(this, map);
		},

		/**
    * As real pattern bounds depends on map zoom and bounds,
    * we just compute the total bounds of all paths decorated by this instance.
    */
		_initBounds: function _initBounds () {
			const allPathCoords = this._paths.reduce(function (acc, path) {
				return acc.concat(path);
			}, []);
			return L$1.latLngBounds(allPathCoords);
		},

		getBounds: function getBounds () {
			return this._bounds;
		},

		/**
    * Returns an array of ILayers object
    */
		_buildSymbols: function _buildSymbols (latLngs, symbolFactory, directionPoints) {
			const _this2 = this;

			return directionPoints.map(function (directionPoint, i) {
				return symbolFactory.buildSymbol(directionPoint, latLngs, _this2._map, i, directionPoints.length);
			});
		},

		/**
    * Compute pairs of LatLng and heading angle,
    * that define positions and directions of the symbols on the path
    */
		_getDirectionPoints: function _getDirectionPoints (latLngs, pattern) {
			const _this3 = this;

			if (latLngs.length < 2) {
				return [];
			}
			const pathAsPoints = latLngs.map(function (latLng) {
				return _this3._map.project(latLng);
			});
			return projectPatternOnPointPath(pathAsPoints, pattern).map(function (point) {
				return {
					latLng: _this3._map.unproject(L$1.point(point.pt)),
					heading: point.heading
				};
			});
		},

		redraw: function redraw () {
			if (!this._map) {
				return;
			}
			this.clearLayers();
			this._draw();
		},

		/**
    * Returns all symbols for a given pattern as an array of FeatureGroup
    */
		_getPatternLayers: function _getPatternLayers (pattern) {
			const _this4 = this;

			const mapBounds = this._map.getBounds().pad(0.1);
			return this._paths.map(function (path) {
				const directionPoints = _this4._getDirectionPoints(path, pattern)
				// filter out invisible points
					.filter(function (point) {
						return mapBounds.contains(point.latLng);
					});
				return L$1.featureGroup(_this4._buildSymbols(path, pattern.symbolFactory, directionPoints));
			});
		},

		/**
    * Draw all patterns
    */
		_draw: function _draw () {
			const _this5 = this;

			this._patterns.map(function (pattern) {
				return _this5._getPatternLayers(pattern);
			}).forEach(function (layers) {
				_this5.addLayer(L$1.featureGroup(layers));
			});
		}
	});
	/*
 * Allows compact syntax to be used
 */
	L$1.polylineDecorator = function (paths, options) {
		return new L$1.PolylineDecorator(paths, options);
	};
}));
