#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
git status && git log -1 > $DIR/../src/git-commit-info.txt || echo 'Not a Git repo. Continue...'
