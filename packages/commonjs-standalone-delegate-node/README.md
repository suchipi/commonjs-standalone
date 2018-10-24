# `commonjs-standalone-delegate-node`

`commonjs-standalone-delegate-node` is an example of a `commonjs-standalone` delegate.
It uses [the `resolve` package from npm](https://npm.im/resolve) to resolve modules and node's `fs` and `vm` modules to read and run them.

You wouldn't _actually_ need `commonjs-standalone` in node since it has a built-in CommonJS loader, but this package nonetheless serves as a useful example.

## License

MIT
