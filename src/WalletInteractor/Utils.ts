export function withTimeoutAndUpdate(timeout_in_ms: number, promise: any) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Timeout"));
    }, timeout_in_ms);
  });

  return Promise.race([promise, timeoutPromise]);
}
