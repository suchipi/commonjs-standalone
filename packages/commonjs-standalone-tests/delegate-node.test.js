import { describe, test, expect } from "vitest";
import vm from "vm";
import pathLessTraveled from "path-less-traveled";
import { requireMain } from "../commonjs-standalone";
import { delegate, makeDelegate } from "../commonjs-standalone-delegate-node";

const fixturesDir = pathLessTraveled.pathMarker(__dirname + "/fixtures");

describe("commonjs-standalone-delegate-node", () => {
  test("works", () => {
    const result = requireMain(fixturesDir("blah.js"), delegate);
    expect(result).toBe("blah");

    const result2 = requireMain(fixturesDir("blah-again.js"), delegate);
    expect(result2).toBe("blahblah");
  });

  test("json module works", () => {
    const result = requireMain(fixturesDir("data.json"), delegate);
    expect(result).toEqual({ a: 54 });

    const result2 = requireMain(fixturesDir("loads-json.js"), delegate);
    expect(result2).toEqual({ a: 54 });
  });

  test("different context works", () => {
    const context = vm.createContext({ myGlobal: 5 });
    const delegate2 = makeDelegate(context);

    const result = requireMain(fixturesDir("my-global.js"), delegate2);
    expect(result).toBe(5);
  });
});
