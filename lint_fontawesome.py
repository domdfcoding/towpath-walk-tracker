# stdlib
import re
import sys
from collections.abc import Iterator
from typing import Dict, List, Tuple

# 3rd party
import bs4
import dict2css
from domdf_python_tools.paths import PathPlus, unwanted_dirs

icons_scss_file = PathPlus("scss/fontawesome/_icons.scss")
icons_scss = icons_scss_file.read_lines()

enabled_icons: dict[str, int] = {}
disabled_icons: dict[str, int] = {}
within_block_comment: bool = False


def get_icon_name(rule_css: str) -> str:
	css_dict = dict2css.loads(rule_css)
	assert len(css_dict) == 1
	m = re.match(r"\.fa-(.*):before", next(iter(css_dict)))
	assert m is not None
	return m.group(1)


for lineno, line in enumerate(icons_scss):
	line = line.strip().replace("#{$fa-css-prefix}", "fa")
	line = re.sub(r"content: fa-content\(.*\);", '', line)

	lineno += 1

	if not line:
		continue

	if not within_block_comment:
		if line.startswith("/*"):
			within_block_comment = True
			continue

		if line.startswith("//"):
			disabled_icons[get_icon_name(line.lstrip('/'))] = lineno
		else:
			enabled_icons[get_icon_name(line)] = lineno

	elif line.endswith("*/"):
		within_block_comment = False

# TODO: html within python


def get_icons_in_file(file: PathPlus) -> list[tuple[str, int]]:  # Icon name and line number
	icon_names = []

	soup = bs4.BeautifulSoup(file.read_text(), "html.parser")
	i_tags: list[bs4.element.Tag] = soup.find_all('i')

	if not i_tags:
		return []

	for tag in i_tags:

		for cls in tag["class"]:
			if cls == "fa-solid":
				continue

			if cls.startswith("fa-"):
				icon_names.append((cls[3:], tag.sourceline))  # TODO: col offset

	return icon_names


disabled_template = "{filename}:{lineno} Icon fa-{icon} used but is not enabled in the fontawesome SCSS ({scss_filename}:{scss_lineno})"


def format_filename(file: PathPlus):
	return file.relative_to('.').as_posix()


def lint_file(file: PathPlus) -> Iterator[str]:
	used_icons = get_icons_in_file(file)
	if not used_icons:
		return

	for icon, lineno in used_icons:
		if icon in enabled_icons:
			continue
		elif icon in disabled_icons:
			yield disabled_template.format(
					filename=format_filename(file),
					lineno=lineno,
					icon=icon,
					scss_filename=format_filename(icons_scss_file),
					scss_lineno=disabled_icons[icon],
					)
		else:
			yield f"{format_filename(file)}:{lineno} Icon fa-{icon} not recoginsed"


if __name__ == "__main__":
	ret = 0

	for file in PathPlus('.').iterchildren(exclude_dirs=(*unwanted_dirs, "node_modules", "old")):
		if file.suffix not in {".html", ".jinja2"}:
			continue

		for error in lint_file(file):
			ret |= 1
			print(error)

	sys.exit(ret)
