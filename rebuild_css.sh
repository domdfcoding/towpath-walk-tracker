#!/bin/bash

RETV=0

compile () {
  OUTFILE=$2
  # OUTFILE_MAP="$OUTFILE.map"

  if test -f "$OUTFILE"; then
    CURRENT_SHA=$(sha256sum "$OUTFILE")
  else
    CURRENT_SHA=''
  fi

  # if test -f "$OUTFILE_MAP"; then
  #   CURRENT_MAP_SHA=$(sha256sum "$OUTFILE_MAP")
  # else
  #   CURRENT_MAP_SHA=''
  # fi

  npx sass "$1" "$OUTFILE" --style compressed --no-source-map

  # for file in $OUTFILE $OUTFILE_MAP; do
  for file in $OUTFILE; do
    sed -i '1s/^\xEF\xBB\xBF//' "$file"
    sed -i -e '$a\' "$file"
  done

  if [ "$CURRENT_SHA" != "$(sha256sum "$OUTFILE")" ]; then
    echo "$OUTFILE changed"
    git stage "$OUTFILE"
    RETV=1
  fi

  # if [ "$CURRENT_MAP_SHA" != "$(sha256sum "$OUTFILE_MAP")" ]; then
  #   echo "$OUTFILE_MAP changed"
  #   git stage "$OUTFILE_MAP"
  #   RETV=1
  # fi

}

# Compile SCSS for Font Awesome
compile "scss/fontawesome/fontawesome.scss" "towpath_walk_tracker/static/css/fontawesome.min.css"

# Compile SCSS for Font Awesome
compile "scss/bootstrap/bootstrap.scss" "towpath_walk_tracker/static/css/bootstrap.min.css"

# Minify other files
# compile "towpath_walk_tracker/static/css/main.css" "towpath_walk_tracker/static/css/main.min.css"

exit $RETV
