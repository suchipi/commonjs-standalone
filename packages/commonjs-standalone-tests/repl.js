const { requireMain } = require("commonjs-standalone");

const delegate = {
  resolve: (id, fromFilePath) => {
    return id;
  },
  read: filepath => {
    return modules[filepath];
  },
  run: (code, moduleEnv, filepath) => {
    const wrapper = eval(
      "(function (exports, require, module, __filename, __dirname) { " +
        code +
        "\n})"
    );
    wrapper(
      moduleEnv.exports,
      moduleEnv.require,
      moduleEnv.module,
      moduleEnv.__filename,
      moduleEnv.__dirname
    );
  }
};
const modules = {};

const repl = require("repl");
const replServer = repl.start("> ");
Object.assign(replServer.context, {
  modules,
  delegate,
  requireMain
});
