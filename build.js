#!/usr/bin/env jsh
/// <reference types="@suchipi/jsh" />

const tsc = absPath("./node_modules/.bin/tsc");
const kame = absPath("./node_modules/.bin/kame");

cd(absPath("./packages/commonjs-standalone"));
fs.rmSync("./dist", { recursive: true, force: true });
exec(tsc);
exec(kame, "bundle", {
  input: "./dist/index.js",
  output: "./dist/umd.js",
  global: "commonjsStandalone",
});

cd(absPath("./packages/commonjs-standalone-delegate-node"));
fs.rmSync("./dist", { recursive: true, force: true });
exec(tsc);
