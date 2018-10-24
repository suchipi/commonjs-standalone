const { requireMain } = require("commonjs-standalone");

describe("commonjs-standalone", () => {
  let delegate;
  let modules;
  let logOutput;

  const log = msg => {
    logOutput.push(msg);
  };

  beforeEach(() => {
    logOutput = [];
    delegate = {
      resolve: jest.fn((id, fromFilePath) => {
        return id;
      }),
      read: jest.fn(filepath => {
        return modules[filepath];
      }),
      run: jest.fn((code, moduleEnv, filepath) => {
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
      })
    };
    modules = {};
  });

  test("require one module from another", () => {
    modules["one"] = `
      require("two");
    `;
    modules["two"] = `
      log("hi from two");
    `;
    requireMain("one", delegate);
    expect(logOutput).toEqual(["hi from two"]);
  });

  test("module is cached", () => {
    modules["one"] = `
      require("two");
      require("two");
    `;
    modules["two"] = `
      log("hi from two");
    `;
    requireMain("one", delegate);
    expect(logOutput).toEqual(["hi from two"]);
  });

  test("delete module from cache to reload it", () => {
    modules["one"] = `
      require("two");
      delete require.cache[require.resolve("two")];
      require("two");
    `;
    modules["two"] = `
      log("hi from two");
    `;
    requireMain("one", delegate);
    expect(logOutput).toEqual(["hi from two", "hi from two"]);
  });
});
