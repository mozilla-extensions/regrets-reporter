/* eslint-env node */

const options = {
  plugins: [
    require("tailwindcss")("./tailwind.config.js"),
    require("postcss-preset-env"),
  ],
};

if (process.env.NODE_ENV === "development") {
  options.map = { inline: true };
}

module.exports = options;
