# Free BankRegX membership

This change is based on `sync-live-site` at c449cb7 and preserves the four
assessment modes, regulatory intelligence and Governance Admin routes.

## Allowances

- Visitors: one assessment per browser per UTC calendar month.
- Free members: five assessments per verified Firebase account per UTC calendar month.
- All four modes share the same `/api/ask` allowance; reading news and docs is not an assessment.
- Registration is free; no payment processor or paid plan is included.
- A visitor's allowance and a registered member's allowance are separate. Signing
  up unlocks five member assessments, independently of the visitor assessment.
- Reset is at 00:00 UTC on the first day of each month, not 30 days after a search.
- A visitor is identified by a signed, HttpOnly, SameSite=Strict cookie. This is a
  browser allowance, not proof of a person's identity: clearing cookies, private
  browsing or changing browsers can obtain another visitor allowance. Strict
  per-person limits require requiring verified accounts before any assessment.
- Changing browser-supplied userId/plan/limit fields cannot grant membership.
  Firebase Admin verifies the ID token, revocation state and verified-email claim.
- Email verification is required before a new account receives the member limit.
- Signing out returns to that browser's visitor allowance; signing in elsewhere
  retains the account's member usage.

## Server enforcement

`/api/ask` verifies identity and atomically reserves allowance in Firestore before
retrieving guidance, calling OpenAI or doing paid research. Conflicting Firestore
transactions retry, preventing parallel requests and serverless instances from
overspending the same quota. Blocked requests return HTTP 429 with
`MONTHLY_LIMIT_REACHED`, remaining allowance and reset time. Membership/account
configuration errors fail closed. Invalid tokens return 401 instead of silently
falling back to a visitor.

The server stores monthly counters in `monthly_assessment_usage`, with request
reservations in each counter's `attempts` subcollection. It finalizes success and
refunds handled failures once, against the original month even across a reset.
If the process is killed before cleanup (for example a platform timeout), its
reservation remains charged. No automatic cleanup job is included. Staff can
investigate and adjust a stranded reservation using trusted administrative access.

New Firestore rules prevent clients modifying counters and prevent newly
registered accounts reading other users' histories, feedback or internal logs.
Rules do not restrict the trusted Admin SDK. Do not open the database to clients
or disable email verification to make registration work.

## Firebase and Vercel setup before release

1. In the Firebase project used by BankRegX, open **Authentication → Sign-in
   method** and enable **Email/Password** (passwordless email-link sign-in is not
   required). Review the verification and password-reset email templates.
2. Confirm the correct application domains in Firebase Authentication settings,
   including `bankregx.com` and the preview hostname where appropriate. Test the
   verification email and password-reset links on the preview.
3. In Vercel's **Preview** environment, retain the existing server credentials:
   `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
   `FIREBASE_ADMIN_PRIVATE_KEY`, `BANKREGX_SESSION_SECRET`, `OPENAI_API_KEY` and
   the site's existing research credentials. Do not replace production values or
   commit credentials. `BANKREGX_SESSION_SECRET` must be a strong random secret;
   keep it stable because rotating it changes visitor cookies and quota keys.
4. Confirm the browser config exists as Next.js public build variables:
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
   These are Firebase web application identifiers, not Admin private keys.
   Use the same Firebase project as the Admin SDK. Preserve other existing
   Firebase web settings. Rebuild after changing public variables.
5. Review and deploy the updated **firestore.rules** to the intended Firebase
   project before exposing public registration. Using an explicitly selected
   project: `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`.
   This command changes shared database rules: review first, preferably test
   against a separate staging Firebase project. It has NOT been executed here.
6. Deploy this feature branch as a Vercel **Preview**, verify the checks below,
   and only then decide whether to merge/promote. Nothing has been deployed by
   this implementation.

## Validation

Run with Node 24 or newer (API tests use Node's module hooks):

```sh
npm ci --no-audit --no-fund
node tests/assessment-api.test.js
npx --no-install eslint components/MembershipPanel.js lib/assessmentIdentity.js lib/monthlyUsage.js lib/firebaseClientAuth.js lib/firebaseAdmin.js pages/api/membership/status.js pages/api/ask.js tests/membership.test.js tests/assessment-api.test.js
npm run build -- --webpack
```

The API test command executes 12 unit/API tests, with simulated transactional
storage and mocked Firebase token verification/OpenAI. These tests make no paid
calls, send no emails and do not prove live Firebase connectivity. The tests cover
concurrent 1/5 limits, month/year resets, cookie tampering, invalid/unverified
identity, handled-failure refunds and rejection before calling OpenAI.

Webpack build works in the cloud sandbox; the default Turbopack build requires
worker-port capabilities unavailable here. The existing `next lint` script is not
supported by Next 16; use the explicit ESLint command above for this change.

On a configured staging/preview environment, verify:

- First visitor assessment succeeds; second is blocked and exposes free signup.
- Register, verify email, refresh verification; member allowance is five.
- First five member assessments succeed across different modes/tabs; sixth is blocked.
- Signing in on another browser retains the same member allowance.
- Signing out restores the visitor view; expired/revoked tokens cannot grant access.
- Password reset and email verification links work; failures provide useful messages.
- Guidance, Governance Admin, Expert Studio and Review Queue still require their
  existing independent admin credentials; public membership confers no admin role.
- Rules prevent authenticated clients reading other users' records or writing usage.

Live Firebase signup/email delivery, production OpenAI calls and deployed rules
remain unverified until the correct project configuration is provided securely.
