import {
  GatewayProcessor,
  manifestBucket,
  StringManifestBuilder,
} from "../src";
import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import { FungibleResource, NonFungibleItem, NonFungibleResource } from "../src";

const toolkit_test_account: string =
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
        "https://assets.radixdlt.com/icons/icon-xrd.png",
      );
      expect(xrd_resource.information.symbol).toBe("XRD");
    }
  }
});

test("Test Parse Non Fungible Resource Information", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Mainnet);
  let resource_map = await transactionProcessor.getResourcesInformation(
    ["resource_rdx1n2ekdd2m0jsxjt9wasmu3p49twy2yfalpaa6wf08md46sk8dfmldnd"],
    ["tags"],
  );

  let scorps = resource_map.get(
    "resource_rdx1n2ekdd2m0jsxjt9wasmu3p49twy2yfalpaa6wf08md46sk8dfmldnd",
  );
  expect(scorps).toBeDefined();

  if (scorps) {
    expect(scorps.type).toBe("NonFungible");
    let tags = scorps.information.otherMetadata.get("tags");
    expect(tags).toBeDefined();

    if (tags) {
      if (tags.programmatic_json.kind == "Array") {
        let tags_value = tags.programmatic_json.elements
          .map((tag) => {
            if (tag.kind == "String") {
              return tag.value;
            } else {
              return "";
            }
          })
          .sort((a, b) => a.localeCompare(b));

        expect(tags_value).toEqual(["Art", "Collectible", "NFT"]);
      }
    }
  }
});

test("Test Get Fungible Resources", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let fungibles_held =
    await transactionProcessor.getFungibleResourcesHeldBy(toolkit_test_account);

  expect(fungibles_held.length).toEqual(2);

  let resource_map = new Map<string, FungibleResource>();
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
    expect(xrd.amountHeld).toEqual(20000);
    expect(shard.amountHeld).toEqual(22);
  }
});

test("Test Get Non Fungible Resources", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let non_fungibles_held =
    await transactionProcessor.getNonFungibleResourcesHeldBy(
      toolkit_test_account,
    );

  expect(non_fungibles_held.length).toEqual(2);

  let resource_map = new Map<string, NonFungibleResource>();
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

    expect(loan_receipt.idsHeld.sort()).toEqual(receipt_id);
    expect(marker_receipt.idsHeld.sort()).toEqual(marker_id);
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
      nonFungibleData: new Map<string, string>([
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

test("Test transaction stream", async () => {
  const transactionProcessor = GatewayProcessor.fromNetworkId(
    NetworkId.Stokenet,
  );

  let stream = await transactionProcessor.fullTransactionStream(
    66000000,
    false,
    undefined,
    10,
  );
  expect(stream.length).toEqual(10);
});

test("Test get data with state", async () => {
  const transactionProcessor = GatewayProcessor.fromNetworkId(
    NetworkId.Mainnet,
  );

  let stream = await transactionProcessor.getNonFungibleItemsFromIds(
    "resource_rdx1n2pf8l2qwzzqz5lyuhmdnlxcjqdyxksa5uhtzjjx8zg2tegcdqkd7p",
    ["#1750#"],
    135409909,
  );

  expect(stream.length).toEqual(1);

  const item = stream[0];

  expect(item.description).toBeDefined();
  expect(item.nonFungibleData).toBeDefined();
  expect(item.name).toBeDefined();
  expect(item.imageUrl).toBeDefined();
});

test("Manifest builder ", () => {
  const account =
    "account_tdx_2_12yx3ftggkd62d5hew8pfkm9tfffenyj5zy4gvd2hdemqck64ywsvx4";
  const component =
    "component_tdx_2_1crttvh8h9y9f23r73s89vr78gtsv4qm0k6t3eg8vlj6jre0x7ykx88";
  const xrd =
    "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc";

  const manifest = new StringManifestBuilder()
    .fungibleBucket(account, { address: xrd, amount: 120 }, "bucket")
    .callMethod(component, "bid", ["1u64", manifestBucket("bucket")])
    .depositBatch(account)
    .build();

  expect(manifest).toEqual(
    `CALL_METHOD
\tAddress("account_tdx_2_12yx3ftggkd62d5hew8pfkm9tfffenyj5zy4gvd2hdemqck64ywsvx4")
\t"withdraw"
\tAddress("resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc")
\tDecimal("120")
;
TAKE_FROM_WORKTOP
\tAddress("resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc")
\tDecimal("120")
\tBucket("bucket")
;
CALL_METHOD
\tAddress("component_tdx_2_1crttvh8h9y9f23r73s89vr78gtsv4qm0k6t3eg8vlj6jre0x7ykx88")
\t"bid"
\t1u64
\tBucket("bucket")
;
CALL_METHOD
\tAddress("account_tdx_2_12yx3ftggkd62d5hew8pfkm9tfffenyj5zy4gvd2hdemqck64ywsvx4")
\t"deposit_batch"
\tExpression("ENTIRE_WORKTOP")
;`,
  );
});

test("", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let non_fungible = await transactionProcessor.getNonFungibleItemsFromIds(
    "resource_tdx_2_1ngp0s9w7pghjg7lgugsyhl0skrwgn53h8axcrtczp3qcnwp46l3768",
    ["{cad0386d2bc626d9-9ef343853cea61f1-ae7218d22bc9e5c1-4b88bea1d3fda535}"],
  );
  console.log(non_fungible);
  const regex = /([a-zA-Z0-9_]+) => (\d+)/g;
  const lockedMap = new Map<string, number>();

  let match;
  while (
    (match = regex.exec(
      non_fungible[0]!.nonFungibleData!.get("locked_fungible_resources")!,
    )) !== null
  ) {
    lockedMap.set(match[1], parseInt(match[2], 10));
  }

  console.log(lockedMap);

  expect(0);
});
