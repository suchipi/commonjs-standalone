#!/usr/bin/env node
const path = require("path");
const { test, mkdir, rm, exec, cd } = require("shelljs");
const Case = require("case");
const packageJson = require("../package.json");

const binPath = (binName) =>
  path.resolve(__dirname, "..", "node_modules", ".bin", binName);

packageJson.workspaces.forEach((workspace) => {
  const srcPath = path.join(workspace, "src");
  if (!test("-d", srcPath)) {
    return;
  }

  console.log(`\n--- Building ${workspace} ---\n`);
  const distPath = path.join(workspace, "dist");

  mkdir("-p", distPath);
  rm("-rf", path.join(distPath, "*"));

  cd(workspace);
  exec(binPath("tsc"));
  cd(path.join(__dirname, ".."));

  const umdBundleName = Case.camel(workspace.replace(/^packages\//, ""));
  exec(
    `${binPath(
      "rollup"
    )} -c rollup.config.js ${distPath}/index.js --file ${distPath}/umd.js --format umd --name ${umdBundleName}`
  );
});
