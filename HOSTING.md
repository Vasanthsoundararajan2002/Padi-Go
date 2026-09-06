# Padi and Go hosting

## Deploy the current React preview free

Use Cloudflare Pages. This project is a static Vite app; it needs no database or backend to display the current preview.

1. Sign in at https://dash.cloudflare.com using your preferred email. It does not need to match the Gmail registered for the Jio Gemini offer.
2. Open Workers & Pages, create a Pages application, and import a Git repository.
3. Authorize access to `Vasanthsoundararajan2002/Padi-Go` only, and select the `main` branch.
4. Set root directory to the repository root, build command to `pnpm run build`, and output directory to `dist`.
5. Set `NODE_VERSION` to `22` and `PNPM_VERSION` to `11.19.0` in build environment settings. No application secrets are required.
6. Save and deploy. Cloudflare assigns an available `*.pages.dev` address; do not assume a particular address until deployment completes.
7. Check all three languages, signup preview, subject animation and lesson controls on the published address. Future pushes to main trigger rebuilds.

Reference: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

## Later: FastAPI and MySQL

For a learning pilot, use a Render Free Python web service for FastAPI and an Aiven Free MySQL service. React calls FastAPI over HTTPS; only FastAPI connects to MySQL using certificate-verified TLS. Cross-origin authentication and CORS must be designed when the backend is implemented.

Render Free services sleep after 15 minutes without traffic and have usage limits. Aiven Free MySQL currently provides 1 CPU, 1 GB RAM and 1 GB storage, with inactivity and service limitations. These are pilot options, not a guaranteed enterprise production service. Neither backend nor cloud database has been deployed by this change.

References: https://render.com/docs/free and https://aiven.io/docs/products/mysql/concepts/mysql-free-tier

## Jio / Gemini offer

The supplied screenshot advertises a Jio Google AI Pro subscription and JioAICloud file backup. It does not establish web application hosting or a running MySQL server. Google AI Pro eligibility/credits must be verified in the actual redeemed account, separately from Google Cloud billing. Using the same Gmail for GitHub does not grant hosting credits.

Reference: https://www.jio.com/google-gemini-offer/
