import { manifestArray, manifestLocalId, manifestTuple } from "./ManifestTypes";

export function instruction(
  instructionName: string,
  instructionArguments: string[],
): string {
  return `${instructionName}\n\t${argumentsString(instructionArguments)}\n;`;
}

export function argumentsString(args: string[]): string {
  return args.join("\n\t");
}

export function convertToDataMap(
  idDataMap: Map<string, string[]>,
): Map<string, string> {
  const correctedMap = new Map<string, string>();
  for (const [key, value] of idDataMap.entries()) {
    correctedMap.set(
      manifestLocalId(key),
      manifestTuple([manifestTuple(value)]),
    );
  }
  return correctedMap;
}

export function convertToDataArray(dataArray: string[][]): string {
  const elements = dataArray.map((elems) =>
    manifestTuple([manifestTuple(elems)]),
  );
  return manifestArray("Tuple", elements);
}
