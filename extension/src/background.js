/* global feature */

async function onEveryExtensionLoad() {
  await feature.configure();
}
onEveryExtensionLoad();
