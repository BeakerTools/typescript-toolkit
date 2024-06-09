import { GatewayProcessor } from "../src/GatewayProcessor/GatewayProcessor";
import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import {
  ComponentAddress,
  FungibleResource,
  NonFungibleItem,
  NonFungibleResource,
  ResourceAddress,
} from "../src/Types/RadixTypes";

const toolkit_test_account: ComponentAddress =
  "account_tdx_2_12xckkd70cgwp6a8k2td9d9r0kch7h3dl47ghpvwkdcl7uj7wyw99ca";

test("Test Parse Resource Information", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let resource_map = await transactionProcessor.getResourcesInformation([
    "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
  ]);
  let xrd_resource = resource_map.get(
    "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
  );
  expect(xrd_resource).toBeDefined();
  if (xrd_resource) {
    expect(xrd_resource.type).toBe("Fungible");
    if (xrd_resource.type === "Fungible") {
      expect(xrd_resource.information.name).toBe("Radix");
      expect(xrd_resource.information.description).toBe(
        "The Radix Public Network's native token, used to pay the network's required transaction fees and to secure the network through staking to its validator nodes.",
      );
      expect(xrd_resource.information.icon).toBe(
        "https://assets.radixdlt.com/icons/icon-xrd-32x32.png",
      );
      expect(xrd_resource.information.symbol).toBe("XRD");
    }
  }
});

test("Test Get Fungible Resources", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let fungibles_held =
    await transactionProcessor.getFungibleResourcesHeldBy(toolkit_test_account);

  expect(fungibles_held.length).toEqual(2);

  let resource_map = new Map<ResourceAddress, FungibleResource>();
  fungibles_held.forEach((resource) => {
    resource_map.set(resource.address, resource);
  });

  const xrd = resource_map.get(
    "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
  );
  const shard = resource_map.get(
    "resource_tdx_2_1tkr048zq66t84vm8hyt0u0856xkpcdyamvzlrlwmn9kwcve596dtrc",
  );

  expect(xrd).toBeDefined();
  expect(shard).toBeDefined();

  if (xrd && shard) {
    expect(xrd.amount_held).toEqual(20000);
    expect(shard.amount_held).toEqual(22);
  }
});

test("Test Get Non Fungible Resources", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let non_fungibles_held =
    await transactionProcessor.getNonFungibleResourcesHeldBy(
      toolkit_test_account,
    );

  expect(non_fungibles_held.length).toEqual(2);

  let resource_map = new Map<ResourceAddress, NonFungibleResource>();
  non_fungibles_held.forEach((resource) => {
    resource_map.set(resource.address, resource);
  });

  const loan_receipt = resource_map.get(
    "resource_tdx_2_1ng08wj8qq35zl74uxgxpl9yu2fr3mrqxxr7x3nyrvptffds6tekerh",
  );
  const marker_receipt = resource_map.get(
    "resource_tdx_2_1nt8dz29mh8pjgte9gx5992qczsykj27cvckrlycv3pj66ykyxhg2we",
  );

  expect(loan_receipt).toBeDefined();
  expect(marker_receipt).toBeDefined();

  if (loan_receipt && marker_receipt) {
    const receipt_id = ["#25#"];
    const marker_id = ["#10#"];

    expect(loan_receipt.ids_held.sort()).toEqual(receipt_id);
    expect(marker_receipt.ids_held.sort()).toEqual(marker_id);
  }
});

test("Test Get Non Fungible Ids", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let ids_held = await transactionProcessor.getNonFungibleIdsHeldBy(
    toolkit_test_account,
    "resource_tdx_2_1ng08wj8qq35zl74uxgxpl9yu2fr3mrqxxr7x3nyrvptffds6tekerh",
  );

  const loan_ids = ["#25#"];
  expect(ids_held.sort()).toEqual(loan_ids);
});

test("Test Get Non Fungible Items", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  const loan_id = ["#25#"];

  const nf_items = await transactionProcessor.getNonFungibleItemsFromIds(
    "resource_tdx_2_1ng08wj8qq35zl74uxgxpl9yu2fr3mrqxxr7x3nyrvptffds6tekerh",
    loan_id,
  );
  const expected_items: NonFungibleItem[] = [
    {
      id: loan_id[0],
      description: "",
      non_fungible_data: new Map<string, string>([
        [
          "collateral",
          "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
        ],
        [
          "parent_address",
          "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
        ],
        ["is_pool_unit_collateral", "false"],
        ["collateral_amount", "1000"],
        ["minted_stab", "28.669"],
        ["collateral_stab_ratio", "34.880881788691618124"],
        ["status", "Marked"],
        ["marker_id", "10"],
      ]),
    },
  ];
  expect(nf_items.sort()).toEqual(expected_items);
});

test("Test Get Nft Owner", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  const owners_map = await transactionProcessor.getNftOwners(
    "resource_tdx_2_1ntyqfrz9antsp8ttkxq5nre463lxpnq787ez8r2hr76xfr6tex8xtp",
    ["{d10c067ccc00f8b0-f809ae1e32da41ae-f5881fdcc8c8bbe4-8c3b9d589444feba}"],
  );

  let owner = owners_map.get(
    "{d10c067ccc00f8b0-f809ae1e32da41ae-f5881fdcc8c8bbe4-8c3b9d589444feba}",
  );

  expect(owner).toEqual(
    "account_tdx_2_1298yfy03ertz3dywxqejsvswrz9448dxzw6ak3dz5cdey8gccu63fg",
  );
});
