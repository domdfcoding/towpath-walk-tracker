default: lint

pdf-docs: latex-docs
	make -C doc-source/build/latex/

latex-docs:
	SPHINX_BUILDER=latex tox -e docs

unused-imports:
	tox -e lint -- --select F401

incomplete-defs:
	tox -e lint -- --select MAN

fontawesome:
	tox -e fontawesome

vdiff:
	git diff $(repo-helper show version -q)..HEAD

bare-ignore:
	greppy '# type:? *ignore(?!\[|\w)' -s

lint: unused-imports incomplete-defs bare-ignore fontawesome
	tox -n qa

tsc:
	- npx tsc
	- pre-commit run eslint --files towpath_walk_tracker/static/**/*.js

myts:
	npx tsc --noEmit -p tsconfig_all.json

webpack-dev:
	- npm run dev
	- pre-commit run end-of-file-fixer --files towpath_walk_tracker/static/js/*

webpack:
	- npm run prod
	- pre-commit run end-of-file-fixer --files towpath_walk_tracker/static/js/*

scss:
	pre-commit run compile-css --all-files

run: scss tsc webpack-dev
	python3 -m towpath_walk_tracker run

build: scss tsc webpack
	tox -e build

licence-report:
	npx license-report --only=prod --output html > licence-report.html
