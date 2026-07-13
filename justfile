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

lint: unused-imports incomplete-defs bare-ignore fontawesome myts
	tox -n qa

myts:
	npx tsc --noEmit -p tsconfig.json

js:
	- npx esbuild src/main.ts --bundle --outfile=towpath_walk_tracker/static/js/main.js --sourcemap
	- just --justfile "{{justfile()}}" clean-js

clean-js:
	- pre-commit run trailing-whitespace --files towpath_walk_tracker/static/**/*.js
	- pre-commit run end-of-file-fixer --files towpath_walk_tracker/static/**/*.js
	- pre-commit run end-of-file-fixer --files towpath_walk_tracker/static/**/*.map
	- pre-commit run remove-crlf --files towpath_walk_tracker/static/**/*.js

scss:
	- pre-commit run compile-css --all-files

run: scss js
	python3 -m towpath_walk_tracker run

build: scss js
	tox -e build

licence-report:
	npx license-report --only=prod --output html > licence-report.html
