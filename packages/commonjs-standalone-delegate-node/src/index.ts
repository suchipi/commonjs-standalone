import type {
  Delegate,
  UnresolvedPath,
  ResolvedPath,
  Code,
  ModuleEnvironment,
} from "commonjs-standalone";

import fs from "fs";
import path from "path";
import vm from "vm";
import resolve from "resolve";

const delegate: Delegate = {
  resolve(id: UnresolvedPath, fromFilePath: ResolvedPath): ResolvedPath {
    return resolve.sync(id, {
      basedir: path.dirname(fromFilePath),
      preserveSymlinks: false,
    });
  },
  read(filepath: ResolvedPath): Code {
    return fs.readFileSync(filepath, "utf-8");
  },
  run(code: Code, moduleEnv: ModuleEnvironment, filepath: ResolvedPath): void {
    const wrapper = vm.runInThisContext(
      [
        "(function (exports, require, module, __filename, __dirname) { ",
        code,
        "\n})",
      ].join(""),
      {
        filename: filepath,
      }
    );
    wrapper(
      moduleEnv.exports,
      moduleEnv.require,
      moduleEnv.module,
      moduleEnv.__filename,
      moduleEnv.__dirname
    );
  },
};

module.exports = delegate;
