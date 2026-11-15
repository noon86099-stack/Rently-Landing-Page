import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type LeasePdfData = {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  dueDay: number;
  propertyName: string;
  propertyLocation: string;
  unitLabel: string;
  tenantName: string;
  tenantEmail: string | null;
  tenantPhone: string | null;
};

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function encodeStandardFontText(value: string): string {
  // Standard PDF fonts use WinAnsi encoding. Keep unsupported characters
  // legible instead of allowing one non-Latin name to break the whole export.
  return Array.from(value, (character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 255 ? character : "?";
  }).join("");
}

export async function buildLeasePdf(data: LeasePdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Rently lease draft - ${data.propertyName}`);
  document.setSubject("Owner-generated rental agreement draft");
  document.setCreator("Rently");

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(16 / 255, 34 / 255, 56 / 255);
  const blue = rgb(63 / 255, 124 / 255, 1);
  const muted = rgb(91 / 255, 109 / 255, 128 / 255);
  const pageSize: [number, number] = [612, 792];
  let page = document.addPage(pageSize);
  let y = 744;

  const drawText = (
    value: string,
    options: { font?: typeof regular; size?: number; color?: ReturnType<typeof rgb>; x?: number } = {},
  ) => {
    const font = options.font ?? regular;
    const size = options.size ?? 11;
    const text = encodeStandardFontText(value);
    page.drawText(text, {
      x: options.x ?? 56,
      y,
      size,
      font,
      color: options.color ?? navy,
      maxWidth: 500,
    });
    y -= size + 8;
  };

  const drawSection = (title: string) => {
    y -= 9;
    page.drawLine({
      start: { x: 56, y: y + 5 },
      end: { x: 556, y: y + 5 },
      thickness: 0.6,
      color: rgb(0.82, 0.87, 0.91),
    });
    y -= 16;
    drawText(title.toUpperCase(), { font: bold, size: 9, color: blue });
  };

  drawText("RENTAL LEASE AGREEMENT", { font: bold, size: 18, color: navy });
  drawText("Generated draft — review and complete before signing", {
    size: 9,
    color: muted,
  });
  drawText(`Document reference: ${data.id}`, { size: 8, color: muted });

  drawSection("Parties and premises");
  drawText(`Owner: ${data.propertyName}`, { font: bold });
  drawText(`Property address: ${data.propertyLocation || "Not provided"}`);
  drawText(`Unit: ${data.unitLabel}`);
  drawText(`Tenant: ${data.tenantName}`, { font: bold });
  if (data.tenantEmail) drawText(`Email: ${data.tenantEmail}`);
  if (data.tenantPhone) drawText(`Phone: ${data.tenantPhone}`);

  drawSection("Lease terms");
  drawText(`Lease term: ${displayDate(data.startDate)} through ${displayDate(data.endDate)}`);
  drawText(`Monthly rent: ${data.monthlyRent.toFixed(2)}`);
  drawText(
    `Monthly due day: ${data.dueDay} (when a month has fewer days, the due date is its final day)`,
    { size: 10 },
  );
  drawText(
    "Rently records an unpaid installment as overdue on the day after its due date.",
    { size: 10 },
  );

  drawSection("Agreement");
  drawText(
    "The parties agree to the premises and payment schedule described above. Any additional terms, deposits, utilities, maintenance duties, notices, and local legal requirements must be completed and reviewed by the parties.",
    { size: 10 },
  );
  y -= 20;
  drawText("Owner signature: __________________________________    Date: ______________", {
    size: 10,
  });
  drawText("Tenant signature: _________________________________    Date: ______________", {
    size: 10,
  });

  y -= 14;
  page.drawText(
    "This document is a generated template for review and is not legal advice.",
    {
      x: 56,
      y: Math.max(y, 40),
      size: 8,
      font: regular,
      color: muted,
      maxWidth: 500,
    },
  );

  return document.save();
}
