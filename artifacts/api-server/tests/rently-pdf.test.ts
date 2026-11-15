import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { buildLeasePdf } from "../src/lib/rently-pdf";

test("a real PDF is generated with Unicode tenant and property details", async () => {
  const bytes = await buildLeasePdf({
    id: "33333333-3333-4333-8333-333333333333",
    ownerEmail: "owner@example.test",
    propertyName: "عقار الرياض",
    propertyLocation: "الرياض، حي النخيل",
    unitLabel: "وحدة ١",
    tenantName: "مستأجر تجريبي",
    tenantEmail: "tenant@example.test",
    tenantPhone: "+966 500000000",
    startDate: "2026-01-31",
    endDate: "2026-12-31",
    monthlyRent: 2500,
    dueDay: 31,
  });
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() >= 1);
  assert.match(document.getTitle() ?? "", /عقار الرياض/);
});
