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
const vm = require("vm");
const resolve = require("resolve");

module.exports = ({
  resolve(id: UnresolvedPath, fromFilePath: ResolvedPath): ResolvedPath {
    return resolve.sync(id, {
      basedir: path.dirname(fromFilePath),
      preserveSymlinks: false
    });
  },
  read(filepath: ResolvedPath): Code {
    return fs.readFileSync(filepath, "utf-8");
  },
  run(code: Code, moduleEnv: ModuleEnvironment): void {
    const wrapper = vm.runInThisContext(
      [
        "(function (exports, require, module, __filename, __dirname) { ",
        code,
        "\n})"
      ].join(""),
      {
        filename: moduleEnv.module.id
      }
    );
    wrapper(
      moduleEnv.exports,
      moduleEnv.require,
      moduleEnv.module,
      moduleEnv.__filename,
      moduleEnv.__dirname
    );
  }
}: Delegate);
