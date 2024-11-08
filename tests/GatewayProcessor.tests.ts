import {
  GatewayProcessor,
  manifestBucket,
  StringManifestBuilder,
} from "../src";
import {
  LTSRadixEngineToolkit,
  NetworkId,
  PrivateKey,
} from "@radixdlt/radix-engine-toolkit";
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
        "https://assets.radixdlt.com/icons/icon-xrd-32x32.png",
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
    let tags = scorps.information.other_metadata.get("tags");
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
  expect(item.non_fungible_data).toBeDefined();
  expect(item.name).toBeDefined();
  expect(item.image_url).toBeDefined();
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

test("WTFFFFF", async () => {
  const processor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet, 1);
  const privateKey = new PrivateKey.Ed25519(
    new Uint8Array(
      "209,214,17,209,221,157,43,100,145,156,29,165,22,196,133,74,217,107,190,184,62,45,127,80,20,98,106,128,241,218,153,15"
        .split(",")
        .map((char) => parseInt(char, 16)),
    ),
  );
  const address = await LTSRadixEngineToolkit.Derive.virtualAccountAddress(
    privateKey.publicKey(),
    NetworkId.Stokenet,
  );
  console.log(address);
  const manifest = `CALL_METHOD
\tAddress("account_tdx_2_12xrs867hytec3mx63dujxwezdn7jsqw937nqjrvvlj9xzkxk40rflu")
\t"lock_fee"
\tDecimal("20")
;
CALL_METHOD
\tAddress("account_tdx_2_12xrs867hytec3mx63dujxwezdn7jsqw937nqjrvvlj9xzkxk40rflu")
\t"create_proof_of_amount"
\tAddress("resource_tdx_2_1t42n866d9cure57dy4yvg4wfnze3lc4ptwvyqsgtdt4zautca350sd")
\tDecimal("1")
;
MINT_NON_FUNGIBLE
\tAddress("resource_tdx_2_1n2zyd7q88nampc23e4urhf8w0ymuk7nk0da25x38duhqsf08nry0qa")
\tMap<NonFungibleLocalId, Tuple>(NonFungibleLocalId("<OKK_1>") => Tuple(Tuple("CirCricket", "A mix of sport and computing", "https://i.ibb.co/W2jXK6B/circricket.png", "None")), NonFungibleLocalId("<OKK_2>") => Tuple(Tuple("Spiderboard", "Not recommended for arachnophobe developers", "https://i.ibb.co/LtJXCqJ/spiderboard.png", "None")), NonFungibleLocalId("<OKK_3>") => Tuple(Tuple("Flyware", "Even RDX Works cannot get rid of that", "https://i.ibb.co/nR3gZ90/ultimate-bug.png", "None")), NonFungibleLocalId("<OK_4>") => Tuple(Tuple("CirCricket", "A mix of sport and computing", "https://i.ibb.co/W2jXK6B/circricket.png", "None")), NonFungibleLocalId("<OK_5>") => Tuple(Tuple("Spiderboard", "Not recommended for arachnophobe developers", "https://i.ibb.co/LtJXCqJ/spiderboard.png", "None")), NonFungibleLocalId("<OK_6>") => Tuple(Tuple("Flyware", "Even RDX Works cannot get rid of that", "https://i.ibb.co/nR3gZ90/ultimate-bug.png", "None")))
;
CALL_METHOD
\tAddress("account_tdx_2_12xrs867hytec3mx63dujxwezdn7jsqw937nqjrvvlj9xzkxk40rflu")
\t"deposit_batch"
\tExpression("ENTIRE_WORKTOP")
;
`;
  const result = await processor.submitRawManifest(
    manifest,
    NetworkId.Stokenet,
    privateKey,
  );
  console.log(result);
});
