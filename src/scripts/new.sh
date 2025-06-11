#!/bin/sh

set -e

#!/bin/bash

# Get the current date
DATE=$(date +"%Y-%m-%d")
DIR=$1
TITLE=$2
TITLE=$(echo "$TITLE" | sed 's/_/ /g')

# Create the file with the date and header
FILE="content/${DIR}/${DATE}-${TITLE}".md
touch "$FILE"
cat <<EOF >"$FILE"
---
title: "$(echo "$TITLE" | sed 's/"/\\"/g')"
date: "$DATE"
draft: false
tags: []
---

# $ TITLE

EOF

# Open the file in your preferred text editor
vim "$FILE"
