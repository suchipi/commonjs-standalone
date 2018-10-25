# `commonjs-standalone`

`commonjs-standalone` is a standalone CommonJS loader for use in any JavaScript engine. You give it a way to **resolve**, **read**, and **run** modules, and it will give you the `module`, `exports`, `require`, `__filename`, `__dirname` system you're familiar with from Node.js.

## How it works

This module exports one function called `requireMain`. Given the absolute path to a module and a `Delegate` object, `requireMain` will load the module at that path. You must provide your own `Delegate` object that `commonjs-standalone` will use to **resolve**, **read**, and **run** modules. A `Delegate` object has this shape:

```js
type Delegate = {
  // A module at filepath `fromFilePath` is trying to require `id`.
  // Resolve `id` into an absolute path, or throw an error if it can't be found.
  resolve(id: string, fromFilePath: string): string,

  // Read the contents of the file at `filepath` and return them as a string.
  read(filepath: string): string,

  // Run this code using the provided module environment object. The filepath
  // is provided for your information; for configuring stack traces, or if you
  // want to compile JSON to JS, etc.
  run(
    code: string,
    moduleEnv: {
      module: Object,
      exports: Object,
      require: Function,
      __filename: string,
      __dirname: string
    },
    filepath: string
  ): void
};
```

How you **resolve**, **read**, and **run** modules will vary depending on your engine, which is why those things are left up to you.

## Examples

Here's an example of a very simple `Delegate` that keeps modules in a JavaScript object:

```js
// This delegate loads modules from a JavaScript Object.
const modules = {
  "module-one": "require('module-two');",
  "module-two": "console.log('hi from module-two');"
};

const delegate = {
  resolve(id, fromFilePath) {
    // Normally you would use `fromFilePath` to resolve relative file paths,
    // but in this example, only absolute paths are supported, so nothing
    // needs to be resolved.
    return id;
  },

  read(filepath) {
    return modules[filepath];
  },

  run(code, moduleEnv, filepath) {
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

requireMain("module-one", delegate); // logs 'hi from module-two'
```

Here's a more complex `Delegate` that uses [the `resolve` package from npm](https://npm.im/resolve) to resolve modules and node's `fs` and `vm` modules to read and run them:

```js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const resolve = require("resolve");

const delegate = {
  resolve(id, fromFilePath) {
    return resolve.sync(id, {
      basedir: path.dirname(fromFilePath),
      preserveSymlinks: false
    });
  },

  read(filepath) {
    return fs.readFileSync(filepath, "utf-8");
  },

  run(code, moduleEnv, filepath) {
    const wrapper = vm.runInThisContext(
      "(function (exports, require, module, __filename, __dirname) { " +
        code +
        "\n})",
      { filename: filepath }
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
```

## API Documentation

### `requireMain(filepath: string, delegate: Delegate): void`

`requireMain` is exported from `commonjs-standalone` as a named export. It loads the first module (also called the main module), which will load other modules using its `require` function.

It should be called with an **absolute** path to a file to load, and a `Delegate` that it will use to **resolve**, **read**, and **run** modules.

```js
function requireMain(filepath: string, delegate: Delegate);
```

### `Delegate`

A `Delegate` is an object with three functions on it: `resolve`, `read`, and `run`. Each are documented here.

### `Delegate.resolve(id: string, fromFilePath: string): string`

This function is called when a module at the absolute filepath `fromFilePath`
is trying to require `id`. **Resolve** `id` into an absolute path, or throw an error if it can't be found.

For example, if `/Users/suchipi/my-package/index.js` contained:

```js
require("./foo");
```

Then `Delegate.resolve` would be called with an `id` of `"./foo"` and a `fromFilePath` of `"/Users/suchipi/my-package/index.js"`.

In that example, you would probably want to return `"/Users/suchipi/my-package/foo.js"` (assuming it exists).

### `Delegate.read(filepath: string): string`

This function is called when the module system wants to **read** the contents of the file at the absolute path `filepath`. You should read them and return the code as a string.

### `Delegate.run(code: string, moduleEnv: Object, filepath: string): void`

This function is called when the module system wants to **run** some code. It's called with:

- The code to run,
- a `ModuleEnvironment` object, and
- the absolute path to where the module came from.

The `ModuleEnvironment` object has 5 properties on it that you should expose to the running code: `module`, `exports`, `require`, `__filename`, and `__dirname`.

One way to expose these to your code is to wrap your code in a function:

```js
const wrappedCode =
  "(function (exports, require, module, __filename, __dirname) { " +
  code +
  "\n})";
```

Then you can pass everything from the `ModuleEnvironment` object into the function wrapper after you compile it:

```js
// You probably shouldn't use `eval`, since it leaks local variables into the scope. There is probably a way to
// run this cleanly from your JavaScript Engine's API.
const wrapperFunction = eval(wrappedCode);

wrapperFunction(
  moduleEnv.exports,
  moduleEnv.require,
  moduleEnv.module,
  moduleEnv.__filename,
  moduleEnv.__dirname
);
```

## Supported features

- `module`
  - `module.id`
  - `module.exports`
- `require`
  - `require.resolve`
  - `require.cache` and deleting from `require.cache`
- `exports`
- `__filename`
- `__dirname`
- Circular dependencies

## License

MIT
