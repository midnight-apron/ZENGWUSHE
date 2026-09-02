#!/usr/bin/env bash
set -euo pipefail

pages_base_path="${1:-/zengwu-she}"

NEXT_PUBLIC_BASE_PATH="$pages_base_path" npm run build

while IFS= read -r -d '' exported_file; do
  sed -i \
    -e "s#\"/assets/#\"${pages_base_path}/assets/#g" \
    -e "s#\"/favicon\.svg#\"${pages_base_path}/favicon.svg#g" \
    "$exported_file"
done < <(find dist/client -type f \( -name '*.html' -o -name '*.rsc' \) -print0)

echo "GitHub Pages export ready at dist/client (base path: ${pages_base_path})"
