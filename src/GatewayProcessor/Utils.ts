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
      console.log(err);
      if (loop_count === max_loops) {
        console.log(error_message, err);
        throw err;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
