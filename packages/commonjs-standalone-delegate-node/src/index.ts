import type { Delegate } from "commonjs-standalone";

import fs from "fs";
import vm from "vm";
import {Module} from "module";

const fakeParent = { filename: "", id: "" };
const builtinModules = new Set(Module.builtinModules);

function makeDelegate(context?: vm.Context): Delegate {
  const delegate: Delegate = {
    resolve(id, fromFilePath) {
      if (builtinModules.has(id)) {
        return "builtin:" + id;
      }

      fakeParent.filename = fromFilePath;
      fakeParent.id = fromFilePath;

      // @ts-ignore _resolveFilename does not exist
      return Module._resolveFilename(id, fakeParent, false);
    },

    read(filepath) {
      if (filepath.startsWith("builtin:") || filepath.endsWith(".node")) {
        return "";
      }

      let code = fs.readFileSync(filepath, "utf-8");

      if (code.charCodeAt(0) === 0xfeff) {
        code = code.slice(1);
      }

      if (filepath.endsWith(".json")) {
        return "module.exports = " + code;
      }

      return code.replace(/^#![^\n]+\n/, "\n");
    },

    run(code, moduleEnv, filepath) {
      if (filepath.startsWith("builtin:")) {
        moduleEnv.exports = require(filepath.replace(/^builtin:/, ""));
        moduleEnv.module.exports = moduleEnv.exports;
        return;
      }

      if (filepath.endsWith(".node")) {
        moduleEnv.exports = require(filepath);
        moduleEnv.module.exports = moduleEnv.exports;
      }

      let wrapper;
      if (context == null) {
        wrapper = vm.runInThisContext(Module.wrap(code), { filename: filepath });
      } else {
        wrapper = vm.runInContext(Module.wrap(code), context, { filename: filepath });
      }
      wrapper(
        moduleEnv.exports,
        moduleEnv.require,
        moduleEnv.module,
        moduleEnv.__filename,
        moduleEnv.__dirname
      );
    },
  };

  return delegate;
}

const delegate = makeDelegate();

module.exports = {
  makeDelegate,
  delegate,
};
