#!/usr/bin/env bash
set -exuo pipefail

TSC=$(realpath ./node_modules/.bin/tsc)
KAME=$(realpath ./node_modules/.bin/kame)

pushd ./packages/commonjs-standalone
rm -rf ./dist
$TSC
$KAME bundle --input ./dist/index.js --output ./dist/umd.js --global commonjsStandalone
popd

pushd ./packages/commonjs-standalone-delegate-node
rm -rf ./dist
$TSC
popd
