import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRentlyCheckoutUrls,
  getRentlyPublicBaseUrl,
  hasCurrentRentlyCheckoutUrls,
} from "../src/lib/rently-checkout-urls";

test("checkout success and cancellation return to the configured public origin", () => {
  const origin = getRentlyPublicBaseUrl("https://rently.example/");
  const urls = getRentlyCheckoutUrls(origin);
  assert.equal(origin, "https://rently.example");
  assert.equal(urls.success_url, "https://rently.example/api/rently/tenant-portal/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(urls.cancel_url, "https://rently.example/tenant-portal?payment=cancelled");
});

test("checkout rejects private preview origins and unsafe configuration", () => {
  for (const url of [
    "", "not-a-url", "http://rently.example", "https://preview.replit.dev",
    "https://replit.com", "https://localhost", "https://user:password@rently.example",
    "https://rently.example/private", "https://rently.example/?redirect=elsewhere",
  ]) {
    assert.throws(() => getRentlyPublicBaseUrl(url));
  }
});

test("sessions with stale return URLs must not be reused", () => {
  const urls = getRentlyCheckoutUrls("https://rently.example");
  assert.equal(hasCurrentRentlyCheckoutUrls({ ...urls }, urls), true);
  assert.equal(hasCurrentRentlyCheckoutUrls({
    ...urls,
    success_url: "https://preview.replit.dev/api/rently/tenant-portal/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  }, urls), false);
  assert.equal(hasCurrentRentlyCheckoutUrls({
    ...urls,
    cancel_url: "https://preview.replit.dev/tenant-portal?payment=cancelled",
  }, urls), false);
});
