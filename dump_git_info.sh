#!/bin/sh

git log -1 > src/git-commit-info.txt || echo 'Not a Git repo. Continue...'