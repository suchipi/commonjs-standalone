#!/usr/bin/env node
const path = require("path");
const { mkdir, rm, exec } = require("shelljs");
const packageJson = require("../package.json");

const babelPath = path.resolve(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  "babel"
);

packageJson.workspaces.forEach(workspace => {
  console.log(`\n--- Building ${workspace} ---\n`);

  const srcPath = path.join(workspace, "src");
  const distPath = path.join(workspace, "dist");

  mkdir("-p", distPath);
  rm("-rf", path.join(distPath, "*"));

  exec(`${babelPath} ${srcPath} --out-dir ${distPath}`);
});
