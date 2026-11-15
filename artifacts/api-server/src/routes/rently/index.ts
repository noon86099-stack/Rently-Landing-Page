import { Router, type IRouter } from "express";
import {
  CreateRentlyLeaseBody,
  CreateRentlyLeaseResponse,
  CreateRentlyPropertyBody,
  CreateRentlyPropertyResponse,
  CreateRentlyUnitBody,
  CreateRentlyUnitParams,
  CreateRentlyUnitResponse,
  DownloadRentlyLeasePdfParams,
  RecordRentlyPaymentBody,
  RecordRentlyPaymentParams,
  RecordRentlyPaymentResponse,
} from "@workspace/api-zod";
import { getRentlyContext, requireRentlyAuth } from "../../middlewares/rently-auth";
import { buildLeasePdf } from "../../lib/rently-pdf";

const router: IRouter = Router();

function statusForDatabaseError(code?: string): number {
  if (code === "P0002" || code === "23503" || code === "42501") return 404;
  if (code === "23P01" || code === "23505") return 409;
  if (code === "22023" || code === "22P02") return 400;
  return 500;
}

function failDatabaseRequest(
  req: Parameters<Parameters<typeof router.post>[1]>[0],
  res: Parameters<Parameters<typeof router.post>[1]>[1],
  code?: string,
): void {
  const status = statusForDatabaseError(code);
  req.log[status >= 500 ? "error" : "warn"](
    { code: code ?? "unknown" },
    "Rently data request failed",
  );
  res.status(status).json({
    error:
      status === 404
        ? "The requested record was not found."
        : status === 409
          ? "The requested change conflicts with an existing record."
          : status === 400
            ? "The submitted information is invalid."
            : "The data request could not be completed.",
  });
}

router.post(
  "/rently/properties",
  requireRentlyAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateRentlyPropertyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid property details." });
      return;
    }

    const { client, userId } = getRentlyContext(res);
    const input = parsed.data;
    const { data, error } = await client
      .from("rently_properties")
      .insert({
        owner_id: userId,
        name: input.name.trim(),
        street_address: input.streetAddress?.trim() || null,
        city: input.city?.trim() || null,
        region: input.region?.trim() || null,
        property_type: input.propertyType.trim(),
      })
      .select("id,name,street_address,city,region,property_type")
      .single();

    if (error) {
      failDatabaseRequest(req, res, error.code);
      return;
    }

    res.status(201).json(
      CreateRentlyPropertyResponse.parse({
        id: data.id,
        name: data.name,
        streetAddress: data.street_address,
        city: data.city,
        region: data.region,
        propertyType: data.property_type,
      }),
    );
  },
);

router.post(
  "/rently/properties/:propertyId/units",
  requireRentlyAuth,
  async (req, res): Promise<void> => {
    const params = CreateRentlyUnitParams.safeParse(req.params);
    const parsed = CreateRentlyUnitBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid unit details." });
      return;
    }

    const { client, userId } = getRentlyContext(res);
    const { data, error } = await client
      .from("rently_units")
      .insert({
        owner_id: userId,
        property_id: params.data.propertyId,
        unit_label: parsed.data.unitLabel.trim(),
      })
      .select("id,property_id,unit_label")
      .single();

    if (error) {
      failDatabaseRequest(req, res, error.code);
      return;
    }

    res.status(201).json(
      CreateRentlyUnitResponse.parse({
        id: data.id,
        propertyId: data.property_id,
        unitLabel: data.unit_label,
      }),
    );
  },
);

router.post(
  "/rently/leases",
  requireRentlyAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateRentlyLeaseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid lease details." });
      return;
    }

    const { client } = getRentlyContext(res);
    const input = parsed.data;
    const { data: leaseId, error: createError } = await client.rpc(
      "create_rently_lease_with_schedule",
      {
        p_unit_id: input.unitId,
        p_tenant_full_name: input.tenantFullName.trim(),
        p_tenant_email: input.tenantEmail?.trim() || null,
        p_tenant_phone: input.tenantPhone?.trim() || null,
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_monthly_rent: input.monthlyRent,
        p_due_day: input.dueDay,
      },
    );

    if (createError) {
      failDatabaseRequest(req, res, createError.code);
      return;
    }
    if (typeof leaseId !== "string") {
      req.log.error("Rently lease procedure returned no lease id");
      res.status(500).json({ error: "The lease could not be loaded after creation." });
      return;
    }

    const { data, error: loadError } = await client
      .from("rently_leases")
      .select(
        "id,unit_id,tenant_id,start_date,end_date,status,monthly_rent,due_day,tenant:rently_tenants(id,full_name,email,phone),payments:rently_payments(id,due_date,amount,paid_at)",
      )
      .eq("id", leaseId)
      .single();

    if (loadError) {
      failDatabaseRequest(req, res, loadError.code);
      return;
    }

    const tenant = Array.isArray(data.tenant) ? data.tenant[0] : data.tenant;
    const response = {
      id: data.id,
      unitId: data.unit_id,
      tenantId: data.tenant_id,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      monthlyRent: Number(data.monthly_rent),
      dueDay: Number(data.due_day),
      tenant: tenant
        ? {
            id: tenant.id,
            fullName: tenant.full_name,
            email: tenant.email,
            phone: tenant.phone,
          }
        : null,
      payments: (data.payments ?? []).map((payment) => ({
        id: payment.id,
        dueDate: payment.due_date,
        amount: Number(payment.amount),
        paidAt: payment.paid_at,
      })),
    };

    res.status(201).json(CreateRentlyLeaseResponse.parse(response));
  },
);

router.post(
  "/rently/payments/:paymentId/paid",
  requireRentlyAuth,
  async (req, res): Promise<void> => {
    const params = RecordRentlyPaymentParams.safeParse(req.params);
    const parsed = RecordRentlyPaymentBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid payment details." });
      return;
    }

    const { client } = getRentlyContext(res);
    const { error: recordError } = await client.rpc("record_rently_payment", {
      p_payment_id: params.data.paymentId,
      p_paid_at: parsed.data.paidAt,
    });
    if (recordError) {
      failDatabaseRequest(req, res, recordError.code);
      return;
    }

    const { data, error: loadError } = await client
      .from("rently_payments")
      .select("id,due_date,amount,paid_at")
      .eq("id", params.data.paymentId)
      .single();
    if (loadError) {
      failDatabaseRequest(req, res, loadError.code);
      return;
    }

    res.json(
      RecordRentlyPaymentResponse.parse({
        id: data.id,
        dueDate: data.due_date,
        amount: Number(data.amount),
        paidAt: data.paid_at,
      }),
    );
  },
);

router.get(
  "/rently/leases/:leaseId/pdf",
  requireRentlyAuth,
  async (req, res): Promise<void> => {
    const params = DownloadRentlyLeasePdfParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid lease id." });
      return;
    }

    const { client } = getRentlyContext(res);
    const { data, error } = await client
      .from("rently_leases")
      .select(
        "id,start_date,end_date,monthly_rent,due_day,tenant:rently_tenants(full_name,email,phone),unit:rently_units(unit_label,property:rently_properties(name,street_address,city,region))",
      )
      .eq("id", params.data.leaseId)
      .maybeSingle();

    if (error) {
      failDatabaseRequest(req, res, error.code);
      return;
    }
    if (!data || data.monthly_rent == null || data.due_day == null) {
      res.status(404).json({ error: "Lease not found." });
      return;
    }

    const tenant = Array.isArray(data.tenant) ? data.tenant[0] : data.tenant;
    const unit = Array.isArray(data.unit) ? data.unit[0] : data.unit;
    const property = unit
      ? Array.isArray(unit.property)
        ? unit.property[0]
        : unit.property
      : null;
    if (!tenant || !unit || !property) {
      res.status(404).json({ error: "Lease details were not found." });
      return;
    }

    const pdf = await buildLeasePdf({
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      monthlyRent: Number(data.monthly_rent),
      dueDay: Number(data.due_day),
      propertyName: property.name,
      propertyLocation: [
        property.street_address,
        property.city,
        property.region,
      ]
        .filter(Boolean)
        .join(" · "),
      unitLabel: unit.unit_label,
      tenantName: tenant.full_name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="rently-lease-${data.id}.pdf"`,
      )
      .setHeader("Cache-Control", "private, no-store")
      .send(Buffer.from(pdf));
  },
);

export default router;
