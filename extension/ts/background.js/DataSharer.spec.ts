import { assert } from "chai";
import { DataSharer } from "./DataSharer";
import { Store } from "./Store";
import { mockLocalStorage } from "./lib/mockLocalStorage";

const extension_installation_uuid = "placeholder_extensionInstallationUuid";
const fakeUUID = () => "52cba568-949c-4d5b-88c8-4fbb674452fc";

describe("DataSharer", function() {
  it("should exist", async function() {
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    assert.isObject(dataSharer);
  });
  it("before any shared data", async function() {
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const exportedData = await dataSharer.export();
    assert.deepEqual(exportedData, []);
  });
});
