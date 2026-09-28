import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // SDK calls that invoke the agent (skill discovery + structured output)
    // take noticeably longer than a typical unit test.
    testTimeout: 60_000,
  },
});
