{% set title = "About" %}
{% set description = "Towpath Walk Tracker uses uses folium and leaflet for maps, bootstrap for styling, and flask for the backend." %}


{% macro github_link(name) %}
	<a href="https://github.com/{{ name }}" class="github-link"><i class="fab fa-github"></i></a>
{% endmacro %}

{% macro docs_link(href) %}
	<a href="{{ href }}" class="docs-link"><i class="fas fa-book"></i></a>
{% endmacro %}


# {{ title }}

<div class="d-flex flex-row about-links">
    <div class="p-2">
        <a href="https://github.com/domdfcoding/towpath-walk-tracker"><i class="fab fa-github"></i></a>
        <a href="https://github.com/domdfcoding/towpath-walk-tracker">GitHub</a>
    </div>
</div>

Towpath Walk Tracker uses [bootstrap](https://getbootstrap.com/) for styling,
[folium](https://github.com/python-visualization/folium) and [leaflet](https://leafletjs.com/) for maps, and [flask](https://flask.palletsprojects.com/en/2.0.x/) for the backend.

Basemaps and watercourse data from
<a href="https://www.openstreetmap.org/">OpenStreetMap</a>, under <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>. © OpenStreetMap contributors.

Other libraries used include:

<ul>
    <li>
        <a href="https://htmx.org/">htmx</a>
        {{ github_link("bigskysoftware/htmx") }} for lazy loading.
    </li>
    <li>
        <a href="https://contextily.readthedocs.io/en/latest/">contextily</a>
        {{ github_link("geopandas/contextily") }} for generating walk thumbnail images.
    </li>
    <li>
        folium-zoom-state {{ github_link("domdfcoding/folium-zoom-state") }}
        to preserve map position and zoom on refresh.
    </li>
    <li>
        domdf-folium-tools {{ github_link("domdfcoding/folium-layercontrols") }},
        folium-layercontrols {{ github_link("domdfcoding/folium-layercontrols") }},
        and folium-reset-control {{ github_link("domdfcoding/folium-layercontrols") }}
        for additional folium and leaflet features.
    </li>
</ul>

## License

`towpath-walk-tracker` is distributed under the [MIT License](https://choosealicense.com/licenses/mit/).

```
Copyright © 2025 Dominic Davis-Foster

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.
```

<div class="vspace-15px"></div>

Icons from [Font Awesome](https://fontawesome.com).

```
Font Awesome Free License
-------------------------

Font Awesome Free is free, open source, and GPL friendly. You can use it for
commercial projects, open source projects, or really almost whatever you want.
Full Font Awesome Free license: https://fontawesome.com/license/free.

# Icons: CC BY 4.0 License (https://creativecommons.org/licenses/by/4.0/)
In the Font Awesome Free download, the CC BY 4.0 license applies to all icons
packaged as SVG and JS file types.

# Fonts: SIL OFL 1.1 License (https://scripts.sil.org/OFL)
In the Font Awesome Free download, the SIL OFL license applies to all icons
packaged as web and desktop font files.

# Code: MIT License (https://opensource.org/licenses/MIT)
In the Font Awesome Free download, the MIT license applies to all non-font and
non-icon files.

# Attribution
Attribution is required by MIT, SIL OFL, and CC BY licenses. Downloaded Font
Awesome Free files already contain embedded comments with sufficient
attribution, so you shouldn't need to do anything additional when using these
files normally.

We've kept attribution comments terse, so we ask that you do not actively work
to remove them from files, especially code. They're a great way for folks to
learn about Font Awesome.

# Brand Icons
All brand icons are trademarks of their respective owners. The use of these
trademarks does not indicate endorsement of the trademark holder by Font
Awesome, nor vice versa. **Please do not use brand logos for any purpose except
to represent the company, product, or service to which they refer.**
```

------

Bundled Dependencies:

* Bootstrap v5.3.8 – [MIT Licence, Copyright © 2011-2025 The Bootstrap Authors](https://github.com/twbs/bootstrap/blob/main/LICENSE)
* flatpickr 4.6.13 – [MIT Licence, Copyright © 2017 Gregory Petrosyan](https://github.com/flatpickr/flatpickr/blob/master/LICENSE.md)
* leaflet 1.9.4 – [BSD 2-Clause License, Copyright © 2010-2023, Volodymyr Agafonkin; Copyright © 2010-2011, CloudMade](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE)
* leaflet-geometryutil 0.10.3 – [BSD 3-Clause License, Copyright © 2013, Makina Corpus](https://github.com/makinacorpus/Leaflet.GeometryUtil/blob/master/LICENSE)
* leaflet-polylinedecorator 1.6.0 – [MIT License, Copyright © 2013 Benjamin Becquet](https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/LICENSE)
* leaflet-sidebar – [MIT Licence, Copyright © 2013 Tobias Bieniek](https://github.com/Turbo87/sidebar-v2/blob/master/LICENSE)
* leaflet.awesome-markers 2.0.5 – [MIT Licence, Copyright © 2013 L. Voogdt](https://github.com/lennardv2/Leaflet.awesome-markers/blob/2.0/develop/LICENSE)

------

Map Themes:

* <a href="https://github.com/gravitystorm/openstreetmap-carto">OpenStreetMap Carto</a>
* <a href="https://github.com/der-stefan/OpenTopoMap">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC-BY-SA</a>)
* <a href="https://github.com/hotosm/HDM-CartoCSS">HDM-CartoCSS</a> style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France (used for thumbnail images)
