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

  expect(fungibles_held.length).toEqual(4);

  let resource_map = new Map<ResourceAddress, FungibleResource>();
  fungibles_held.forEach((resource) => {
    resource_map.set(resource.address, resource);
  });

  const xrd = resource_map.get(
    "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
  );
  const usdc = resource_map.get(
    "resource_tdx_2_1t5hkwq4r6dad0mc3hvnqwev0829hfsre3k78tvr5kche88glmd964t",
  );
  const usdt = resource_map.get(
    "resource_tdx_2_1tht65f9m9u9w97rqszwyqrvawy476aqwef0vwrde48n9zest2ut5fv",
  );
  const lendapp = resource_map.get(
    "resource_tdx_2_1thgn6psvkajgxwksedlnyzg7pehnthet8jknxfdpv8k666trmc52a5",
  );

  expect(xrd).toBeDefined();
  expect(usdc).toBeDefined();
  expect(usdt).toBeDefined();
  expect(lendapp).toBeDefined();

  if (xrd && usdc && usdt && lendapp) {
    expect(xrd.amount_held).toEqual(11499.67355617102);
    expect(usdc.amount_held).toEqual(1806.988328022048);
    expect(usdt.amount_held).toEqual(1806.988328022048);
    expect(lendapp.amount_held).toEqual(1000);
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

  const esoteric_bugs = resource_map.get(
    "resource_tdx_2_1n2tshwgfv9e0mrmhghvur44a6682s8g70t0rmh95geqmepcjgvch8t",
  );
  const greeks_gods = resource_map.get(
    "resource_tdx_2_1n2vnaz8re5c2sdydztnesjp0u4gqr5ff02pu95urpluvlg95xy8a38",
  );

  expect(esoteric_bugs).toBeDefined();
  expect(greeks_gods).toBeDefined();

  if (esoteric_bugs && greeks_gods) {
    const eb_ids = ["<EsotericBugs_1>", "<EsotericBugs_2>"];
    const gg_ids = ["<Greeks_Gods_1>", "<Greeks_Gods_2>"];

    expect(esoteric_bugs.ids_held.sort()).toEqual(eb_ids);
    expect(greeks_gods.ids_held.sort()).toEqual(gg_ids);
  }
});

test("Test Get Non Fungible Ids", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  let ids_held = await transactionProcessor.getNonFungibleIdsHeldBy(
    toolkit_test_account,
    "resource_tdx_2_1n2tshwgfv9e0mrmhghvur44a6682s8g70t0rmh95geqmepcjgvch8t",
  );

  const eb_ids = ["<EsotericBugs_1>", "<EsotericBugs_2>"];
  expect(ids_held.sort()).toEqual(eb_ids);
});

test("Test Get Non Fungible Items", async () => {
  let transactionProcessor = GatewayProcessor.fromNetworkId(NetworkId.Stokenet);
  const eb_ids = ["<EsotericBugs_1>", "<EsotericBugs_2>"];

  const nf_items = await transactionProcessor.getNonFungibleItemsFromIds(
    "resource_tdx_2_1n2tshwgfv9e0mrmhghvur44a6682s8g70t0rmh95geqmepcjgvch8t",
    eb_ids,
  );
  const expected_items: NonFungibleItem[] = [
    {
      id: eb_ids[0],
      name: "CirCricket",
      description: "A mix of sport and computing",
      image_url: "https://i.ibb.co/W2jXK6B/circricket.png",
      non_fungible_data: new Map<string, string>([
        ["Insect_Type", "Robot Cricket"],
        ["Insect_TypeType", "None"],
      ]),
    },
    {
      id: eb_ids[1],
      name: "Spiderboard",
      description: "Not recommended for arachnophobe developers",
      image_url: "https://i.ibb.co/LtJXCqJ/spiderboard.png",
      non_fungible_data: new Map<string, string>([
        ["Insect_Type", "Robot Spider"],
        ["Insect_TypeType", "None"],
      ]),
    },
  ];
  expect(nf_items.sort()).toEqual(expected_items);
});
