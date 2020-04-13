import { assert } from "chai";
import { DataSharer } from "./DataSharer";

const extension_installation_uuid = "placeholder_extensionInstallationUuid";
const fakeUUID = () => "52cba568-949c-4d5b-88c8-4fbb674452fc";

describe("DataSharer", function() {
  it("should exist", async function() {
    const dataSharer = new DataSharer();
    assert.isObject(dataSharer);
  });
});
