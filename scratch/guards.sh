#!/bin/sh
# Affiche pour chaque route les middlewares présents dans les 5 lignes suivantes
for f in "$@"; do
  echo "=== $f"
  awk '
    /^router\.(get|post|put|patch|delete)\(/ { if (line!="") print line; line=$0; n=0; next }
    line!="" && n<5 { line=line " " $0; n++ }
    END { if (line!="") print line }
  ' backend/routes_postgres/$f.js | sed -E 's/[[:space:]]+/ /g' | cut -c1-230
done
