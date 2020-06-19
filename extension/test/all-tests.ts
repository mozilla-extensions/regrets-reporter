// @ts-ignore
let context = require.context("../ts", true, /.spec.ts$/);
// @ts-ignore
context.keys().forEach(context);
module.exports = context;
