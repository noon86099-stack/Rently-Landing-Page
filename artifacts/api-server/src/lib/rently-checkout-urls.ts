export function getRentlyPublicBaseUrl(
  configuredUrl = process.env.RENTLY_PUBLIC_URL,
): string {
  if (!configuredUrl) throw new Error("Rently public URL is not configured.");
  const url = new URL(configuredUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.hostname.endsWith(".replit.dev") ||
    url.hostname === "localhost" ||
    url.hostname === "replit.com"
  ) {
    throw new Error("Rently checkout requires a public HTTPS origin.");
  }
  return url.origin;
}

export function getRentlyCheckoutUrls(baseUrl = getRentlyPublicBaseUrl()) {
  return {
    success_url: `${baseUrl}/api/rently/tenant-portal/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/tenant-portal?payment=cancelled`,
  };
}

export function hasCurrentRentlyCheckoutUrls(
  session: { success_url?: string | null; cancel_url?: string | null },
  urls: ReturnType<typeof getRentlyCheckoutUrls>,
) {
  return session.success_url === urls.success_url && session.cancel_url === urls.cancel_url;
}
