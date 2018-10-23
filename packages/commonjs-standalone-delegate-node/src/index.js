// @flow
import type {
  Delegate,
  UnresolvedPath,
  ResolvedPath,
  Code,
  ModuleEnvironment
} from "commonjs-standalone";

const fs = require("fs");
const path = require("path");

export default ({
  resolve(id: UnresolvedPath, fromFilePath: ResolvedPath): ResolvedPath {},
  read(filepath: ResolvedPath): Code {},
  compile(code: Code, moduleEnv: ModuleEnvironment): void {}
}: Delegate);
