import { NonFungibleData } from "../Types/RadixTypes";
import {
  ProgrammaticScryptoSborValue,
  ProgrammaticScryptoSborValueMapEntry,
} from "@radixdlt/babylon-gateway-api-sdk";

export function divideInBatches<T>(collection: T[], batchSize: number): T[][] {
  let batches: T[][] = [];
  for (let i = 0; i < collection.length; i += batchSize) {
    const batch = collection.slice(i, i + batchSize);
    batches.push(batch);
  }
  return batches;
}

export async function withMaxLoops<ReturnType>(
  toRun: () => Promise<ReturnType>,
  error_message: string,
  max_loops: number,
): Promise<ReturnType> {
  let loop_count = 0;
  while (true) {
    try {
      return await toRun();
    } catch (err) {
      loop_count += 1;
      if (loop_count === max_loops) {
        console.log(error_message, err);
        throw err;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export function parseNonFungibleData(
  data: ProgrammaticScryptoSborValue,
): NonFungibleData {
  let name = data.field_name ? data.field_name : "";
  switch (data.kind) {
    case "Array": {
      return {
        name: name,
        value: "(" + dataArrayToString(data.elements) + ")",
      };
    }
    case "Bool": {
      return { name: name, value: data.value ? "true" : "false" };
    }
    case "Bytes": {
      return { name: name, value: data.hex };
    }

    case "Decimal": {
      return { name: name, value: data.value };
    }

    case "Enum": {
      if (data.type_name && data.type_name === "Option") {
        if (data.variant_name === "Some") {
          return { name: name, value: dataArrayToString(data.fields) };
        } else {
          return { name: name, value: "None" };
        }
      } else {
        let value = dataArrayToString(data.fields);
        if (data.fields.length > 0) {
          value = "(" + value + ")";
        }
        if (data.variant_name) {
          value = data.variant_name + value;
        }
        return { name: name, value: value };
      }
    }

    case "I128": {
      return { name: name, value: data.value };
    }
    case "I64": {
      return { name: name, value: data.value };
    }
    case "I32": {
      return { name: name, value: data.value };
    }
    case "I16": {
      return { name: name, value: data.value };
    }
    case "I8": {
      return { name: name, value: data.value };
    }

    case "Map": {
      let value = "(" + mapToString(data.entries) + ")";
      if (data.key_type_name && data.value_type_name) {
        value =
          "<" + data.key_type_name + ", " + data.value_type_name + ">" + value;
      }
      value = "Map" + value;

      return { name: name, value: value };
    }

    case "NonFungibleLocalId": {
      return { name: name, value: data.value };
    }

    case "Own": {
      return { name: name, value: data.value };
    }

    case "PreciseDecimal": {
      return { name: name, value: data.value };
    }

    case "Reference": {
      return { name: name, value: data.value };
    }

    case "String": {
      return { name: name, value: data.value };
    }

    case "Tuple": {
      return { name: name, value: "(" + dataArrayToString(data.fields) + ")" };
    }

    case "U128": {
      return { name: name, value: data.value };
    }
    case "U64": {
      return { name: name, value: data.value };
    }
    case "U32": {
      return { name: name, value: data.value };
    }
    case "U16": {
      return { name: name, value: data.value };
    }
    case "U8": {
      return { name: name, value: data.value };
    }
  }
}

function dataArrayToString(dataArray: ProgrammaticScryptoSborValue[]): string {
  let strArray = dataArray.map((elem) => {
    return parseNonFungibleData(elem).value;
  });
  return arrayStringToString(strArray);
}

function arrayStringToString(arrayStr: string[]): string {
  let str = "";
  arrayStr.forEach((subStr) => {
    str += subStr + ", ";
  });

  str = str.slice(0, -2);

  return str;
}

function mapToString(map: ProgrammaticScryptoSborValueMapEntry[]): string {
  let str = map.map((valueEntry) => {
    let value = parseNonFungibleData(valueEntry.value);
    let kind = parseNonFungibleData(valueEntry.key);
    return kind.value + " => " + value.value;
  });

  return arrayStringToString(str);
}
