import fetch from "node-fetch";

// @ts-ignore
const { Crypto } = require("@peculiar/webcrypto");
// @ts-ignore
global.crypto = new Crypto();

// @ts-ignore
global.fetch = fetch;

// @ts-ignore
global.document = {
  addEventListener: () => {},
};
