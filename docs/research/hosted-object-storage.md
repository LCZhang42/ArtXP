# Hosted object storage options

Research date: 2026-10-11
Decision status: shortlist only; no provider provisioned

ArtXP will continue with SQLite and an ephemeral OpenRouter vision test. Durable artwork storage is deferred until the product workflow needs retained images. At that point, hosted object storage is preferred over requiring local Docker/MinIO.

| Provider | Current free allowance | Fit for ArtXP | Important caveat |
|---|---|---|---|
| Cloudflare R2 Standard | 10 GB-month, 1M Class A operations, 10M Class B operations, free internet egress | Strong preliminary fit; S3-compatible, so the existing boto3/presigned-URL boundary can be reused | Requires a Cloudflare account and R2 subscription/checkout setup; free limits and billing terms must be rechecked |
| Backblaze B2 | First 10 GB storage free, free API calls, free egress up to 3× stored data | S3-compatible and inexpensive; useful alternative if R2 onboarding is unsuitable | Configure spending caps/alerts because usage beyond free allowances can accrue charges |
| Supabase Storage | 1 GB storage and 5 GB egress on the Free plan; 50 MB maximum file upload on Free | Simple dashboard and access-control integration, especially if ArtXP later adopts Supabase | Smaller allowance and free projects may pause after inactivity; less direct reuse of the current S3 boundary |

## Preliminary recommendation

Re-evaluate Cloudflare R2 first when retained artwork becomes necessary. It preserves the existing S3-compatible abstraction and has the largest relevant free operational allowance among this shortlist. Keep the bucket private, use short-lived presigned URLs, set lifecycle deletion rules, and configure billing alerts before accepting user artwork.

Do not create an account yet. Before provisioning, recheck pricing, region/data-residency needs, deletion guarantees, CORS behavior, presigned upload support, and whether a payment method is required.

## Official sources

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 S3 compatibility/getting started: https://developers.cloudflare.com/r2/get-started/
- Backblaze B2 pricing: https://www.backblaze.com/cloud-storage/pricing
- Backblaze data caps and alerts: https://www.backblaze.com/docs/en/cloud-storage-data-caps-and-alerts
- Supabase Storage pricing: https://supabase.com/docs/guides/storage/pricing
- Supabase billing/free-plan limits: https://supabase.com/docs/guides/platform/billing-on-supabase