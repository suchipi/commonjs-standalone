// @flow
export type UnresolvedPath = string;
export type ResolvedPath = string;
export type Code = string;
export type Exports = Object;
export type ModuleCache = { [id: ResolvedPath]: Module };
export type RequireFunction = ((id: UnresolvedPath) => Exports) & {
  resolve: (id: UnresolvedPath) => ResolvedPath,
  cache: ModuleCache
};
export type ModuleEnvironment = {
  module: Module,
  exports: Exports,
  require: RequireFunction,
  __filename: ResolvedPath,
  __dirname: ResolvedPath
};
export type Delegate = {
  resolve(id: UnresolvedPath, fromFilePath: ResolvedPath): ResolvedPath,
  read(filepath: ResolvedPath): Code,
  run(code: Code, moduleEnv: ModuleEnvironment, filepath: ResolvedPath): void
};

// From the node `path` module
function dirname(path: string): string {
  if (path.length === 0) return ".";
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? "/" : ".";
  if (hasRoot && end === 1) return "//";
  return path.slice(0, end);
}

export class Module {
  id: ResolvedPath;
  exports: Exports = {};
  _delegate: Delegate;
  _cache: ModuleCache;

  constructor(id: ResolvedPath, delegate: Delegate, cache: ModuleCache) {
    this.id = id;
    this._delegate = delegate;
    this._cache = cache;
  }

  static _load(
    filepath: ResolvedPath,
    delegate: Delegate,
    cache: ModuleCache
  ): Exports {
    const module = new Module(filepath, delegate, cache);
    cache[filepath] = module;

    try {
      const code = delegate.read(filepath);
      delegate.run(code, module.env(), filepath);
      return module.exports;
    } catch (err) {
      delete cache[filepath];
      throw err;
    }
  }

  require(unresolvedPath: UnresolvedPath): Exports {
    const resolvedPath = this._delegate.resolve(unresolvedPath, this.id);
    if (this._cache[resolvedPath]) {
      return this._cache[resolvedPath].exports;
    }

    return Module._load(resolvedPath, this._delegate, this._cache);
  }

  _makeRequireFunction(): RequireFunction {
    const require = this.require.bind(this);
    require.resolve = (unresolvedPath: UnresolvedPath) => {
      return this._delegate.resolve(unresolvedPath, this.id);
    };
    require.cache = this._cache;

    // $FlowFixMe
    return require;
  }

  env(): ModuleEnvironment {
    return {
      module: this,
      exports: this.exports,
      require: this._makeRequireFunction(),
      __filename: this.id,
      __dirname: dirname(this.id)
    };
  }
}

export function requireMain(filepath: ResolvedPath, delegate: Delegate) {
  Module._load(filepath, delegate, {});
}
