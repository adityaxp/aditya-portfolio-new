## aditya-portfolio

### Admin access

Open `/admin` to sign in with a six-digit code from a time-based authenticator app. The workspace uses `/admin?tab=hosted` and `/admin?tab=analytics`; the sidebar switches between them and can be collapsed.

The server needs `ADMIN_TOTP_SECRET` and a separate `ADMIN_SESSION_SECRET`. If migrating an existing deployment, rename the former analytics-prefixed variables to these names **without changing their values**. The existing authenticator enrollment will continue to work. The old access key is no longer used. Changing the session variable's name will invalidate existing browser sessions.

Codes can be used once. The gate allows four failed attempts per IP and 30 failed attempts overall per hour.

For a new setup or intentional rotation, run `node tools/generate-admin-auth.mjs`, save the printed secrets in your server environment, and enter the printed setup key in Google Authenticator as a **Time based** key. Keep a secure backup of the setup key for phone recovery.
