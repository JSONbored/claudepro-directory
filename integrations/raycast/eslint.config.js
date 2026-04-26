import raycast from "@raycast/eslint-config";

export default [
  ...raycast.flat(Infinity),
  {
    rules: {
      "@raycast/prefer-title-case": "off",
    },
  },
];
