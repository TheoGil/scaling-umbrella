import glsl from "vite-plugin-glsl";

export default {
  plugins: [
    glsl({
      root: "/src/glsl/",
    }),
  ],
  build: {
    outDir: "docs",
  },
  base: "/scaling-umbrella/", // https://vite.dev/guide/static-deploy#github-pages
};
