import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"] /* Outputs .mjs and .js files */,
  splitting: false,
  clean: true /* Cleans the /dist folder before every build */,
  minify: true /* Minifies the output for a tiny footprint */,
  sourcemap: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
});
