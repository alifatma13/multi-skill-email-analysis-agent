/**
 * These are integration tests: reviewEmail() calls the real Claude Agent SDK,
 * so a configured .env (ANTHROPIC_MODEL, and credentials if not preconfigured)
 * is required to run them.
 */
import { describe, expect, it } from "vitest";
import { reviewEmail } from "./email-reviewer.js";
import { sampleEmails } from "./sample-emails.js";

describe("reviewEmail", () => {
  for (const email of sampleEmails) {
    it(`classifies "${email.name}" as ${email.expectedTone}`, async () => {
      const result = await reviewEmail(email.content);

      expect(result.overallTone).toBe(email.expectedTone);
      expect(result.communicationStyle).toMatch(
        /^(assertive|passive|aggressive|passive-aggressive)$/
      );
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.strengths)).toBe(true);

      if (result.score < 80) {
        expect(result.revisedEmail).toBeTruthy();
      }
    });
  }
});
