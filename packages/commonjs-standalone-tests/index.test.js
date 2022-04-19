const { requireMain } = require("../commonjs-standalone");

describe("commonjs-standalone", () => {
  let delegate;
  let modules;
  let logOutput;

  const log = (msg) => {
    logOutput.push(msg);
  };

  beforeEach(() => {
    logOutput = [];
    delegate = {
      resolve: jest.fn((id, fromFilePath) => {
        if (modules[id] != null) {
          return id;
        } else {
          throw new Error(`Could not resolve ${id} from ${fromFilePath}`);
        }
      }),
      read: jest.fn((filepath) => {
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
      }),
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

  test("require calls resolve, read, and run from the delegate", () => {
    modules["one"] = `
      require("two");
    `;
    modules["two-resolved"] = `
      log("hi from two");
    `;

    delegate.resolve = jest.fn(() => "two-resolved");

    requireMain("one", delegate);

    expect(delegate.resolve).toHaveBeenCalledWith("two", "one");
    expect(delegate.read).toHaveBeenCalledWith("two-resolved");
    expect(delegate.run).toHaveBeenCalledWith(
      modules["two-resolved"],
      expect.objectContaining({
        exports: expect.any(Object),
        require: expect.any(Function),
        module: expect.any(Object),
        __filename: expect.any(String),
        __dirname: expect.any(String),
      }),
      "two-resolved"
    );
  });

  test("require.resolve calls resolve from the delegate", () => {
    modules["one"] = `
      require.resolve("two");
    `;
    modules["two"] = ``;

    requireMain("one", delegate);

    expect(delegate.resolve).toHaveBeenCalledWith("two", "one");
  });

  test("require returns the module.exports from another file", () => {
    modules["one"] = `
      const two = require("two");
      log(two);
    `;
    modules["two"] = `
      module.exports = "forty-seven";
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual(["forty-seven"]);
  });

  test("module.exports === exports", () => {
    modules["one"] = `
      log(module.exports === exports);
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual([true]);
  });

  test("setting named exports works", () => {
    modules["one"] = `
      const two = require("two");
      log(two);
    `;
    modules["two"] = `
      exports.something = "forty-seven";
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual([{ something: "forty-seven" }]);
  });

  test("module.id is the resolved name of each module", () => {
    modules["one"] = `
      log(module.id);
      require("two");
    `;
    modules["two"] = `
      log(module.id);
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual(["one", "two"]);
  });

  test("__filename is the resolved name of each module", () => {
    modules["one"] = `
      log(__filename);
      require("two");
    `;
    modules["two"] = `
      log(__filename);
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual(["one", "two"]);
  });

  test("__dirname is the containing directory for each module", () => {
    modules["foo/one"] = `
      log(__dirname);
      require("bar/two");
    `;
    modules["bar/two"] = `
      log(__dirname);
    `;

    requireMain("foo/one", delegate);
    expect(logOutput).toEqual(["foo", "bar"]);
  });

  test("an error is thrown if a module cannot be resolved", () => {
    modules["one"] = `
      log("before");
      require("bad");
      log("after");
    `;

    expect(() => {
      requireMain("one", delegate);
    }).toThrowError();
    expect(logOutput).toEqual(["before"]);
  });

  test("circular dependencies work", () => {
    modules["one"] = `
      exports.before = "before";
      require("two");
      exports.after = "after";
    `;
    modules["two"] = `
      log(Object.assign({}, require("one")));
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual([{ before: "before" }]);
  });

  test("modules that error are not cached", () => {
    modules["one"] = `
      try {
        require("two");
      } catch (err) {
        try {
          require("two");
        } catch (err2) {}
      }
    `;
    modules["two"] = `
      log("in two");
      throw new Error("bad");
    `;

    requireMain("one", delegate);
    expect(logOutput).toEqual(["in two", "in two"]);
  });
});
