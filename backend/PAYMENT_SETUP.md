# M-Pesa Payment (STK Push) Setup – Kenya Shillings (KES)

When a student returns a book and has a fine, the app initiates an **M-Pesa STK push**. The student completes payment on their phone; on success the return is completed automatically. All amounts are in **Kenya Shillings (KES)**.

## Environment variables

Add to your `backend/.env`:

```env
# M-Pesa Daraja API (Safaricom)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey

# Callback URL base (Safaricom will call BACKEND_URL/api/payments/mpesa/callback)
# Use a public URL in production (e.g. https://your-api.com). For local dev use ngrok (see below).
MPESA_CALLBACK_BASE_URL=https://your-api-domain.com
# Or if you use a general app URL:
# APP_URL=https://your-api-domain.com
```

- **Sandbox**: Get credentials from [Safaricom Daraja](https://developer.safaricom.co.ke). Use sandbox shortcode `174379` and the test passkey from the docs.
- **Production**: Use your paybill or till credentials and a publicly reachable `MPESA_CALLBACK_BASE_URL` (no auth; Safaricom calls it).

---

## Using ngrok for M-Pesa callback (local development)

Safaricom’s servers must be able to **POST** to your callback URL. On your machine, `http://localhost:3000` is not reachable from the internet, so you expose it with **ngrok**.

### 1. Install ngrok

- Download from [ngrok.com](https://ngrok.com/download) or install with a package manager:
  - **Windows (scoop):** `scoop install ngrok`
  - **macOS:** `brew install ngrok`
  - **npm:** `npm install -g ngrok`

### 2. Start your backend

```bash
cd backend
npm run start:dev
```

Your API should be running on **http://localhost:3000** (or whatever `PORT` is in `.env`).

### 3. Expose the backend with ngrok

In a **separate terminal**:

```bash
ngrok http 3000
```

(Use your backend port if different, e.g. `ngrok http 4000`.)

You’ll see something like:

```
Forwarding   https://abc123def456.ngrok-free.app -> http://localhost:3000
```

Copy the **HTTPS** URL (e.g. `https://abc123def456.ngrok-free.app`). **Use HTTPS**; Safaricom requires it for the callback.

### 4. Set the callback base URL in `.env`

In `backend/.env` set:

```env
MPESA_CALLBACK_BASE_URL=https://abc123def456.ngrok-free.app
```

Use **your** ngrok URL from step 3. Do **not** add `/api` or `/payments/mpesa/callback` here; the app appends `/api/payments/mpesa/callback` itself.

### 5. Restart the backend

Restart the Nest app so it reads the new env:

```bash
# In the backend terminal: Ctrl+C then
npm run start:dev
```

### 6. Test the flow

1. Trigger a return that has a fine (overdue book).
2. Enter M-Pesa number and confirm; STK push is sent.
3. Complete payment on the phone.
4. Safaricom will call:  
   `POST https://your-ngrok-url.ngrok-free.app/api/payments/mpesa/callback`  
   Your backend receives it via ngrok and marks the fine paid / completes the return.

### Notes

- **Free ngrok URL changes** each time you restart ngrok. Update `MPESA_CALLBACK_BASE_URL` in `.env` and restart the backend whenever the URL changes.
- For a **fixed URL** (so you don’t update `.env` every time), use a paid ngrok plan or another tunnel (e.g. cloudflared).
- You can **inspect callback requests** in the ngrok terminal or at [http://127.0.0.1:4040](http://127.0.0.1:4040) (ngrok’s local inspector).
- If the callback never fires, check: backend is running, ngrok is running, `MPESA_CALLBACK_BASE_URL` is exactly the ngrok **HTTPS** URL with no trailing slash, and you restarted the backend after changing `.env`.

---

## Troubleshooting: "Bad Request - Invalid CallBackURL"

If the API returns `Bad Request - Invalid CallBackURL` when initiating STK push:

1. **Use HTTPS**  
   Safaricom requires the callback URL to be **HTTPS**. With ngrok, use the `https://` URL (e.g. `https://abc123.ngrok-free.app`), not `http://`.

2. **No trailing slash in `.env`**  
   Set the base URL **without** a trailing slash:
   ```env
   MPESA_CALLBACK_BASE_URL=https://abc123.ngrok-free.app
   ```
   Not:
   ```env
   MPESA_CALLBACK_BASE_URL=https://abc123.ngrok-free.app/
   ```

3. **No quotes or spaces**  
   In `.env`, use a single line with no extra quotes or spaces:
   ```env
   MPESA_CALLBACK_BASE_URL=https://your-url.ngrok-free.app
   ```

4. **Check the URL the backend sends**  
   When you trigger a return with a fine, the backend logs the callback URL, e.g.:
   ```
   M-Pesa STK CallBackURL: https://your-url.ngrok-free.app/api/payments/mpesa/callback
   ```
   Confirm it is exactly that **HTTPS** URL and that your ngrok tunnel is running.

5. **Sandbox: register / whitelist callback (if required)**  
   Some Daraja sandbox setups require you to register or whitelist your callback URL in the [Daraja portal](https://developer.safaricom.co.ke):
   - Go to **Dashboard** → **My Apps** → your app.
   - Look for **Callback URL**, **Validation URL**, or **Whitelist** and add your full callback URL:  
     `https://your-ngrok-url.ngrok-free.app/api/payments/mpesa/callback`  
   - Save and try the STK push again.

6. **ngrok URL changes**  
   If you restarted ngrok, the URL changes. Update `MPESA_CALLBACK_BASE_URL` in `.env` with the new **https** URL and restart the backend.

## Flow

1. Student clicks **Return book** (with or without a fine).
2. If there is a fine (overdue or existing pending):
   - Backend creates/uses the fine(s), then initiates an **STK push** to the student’s M-Pesa number (from profile or the return dialog).
   - API responds with `requiresPayment: true`, `checkoutRequestId`, `amount` (KES), `currency: 'KES'`.
3. Frontend shows “Complete payment on your phone” and polls `GET /api/borrows/:id/return-status`.
4. Safaricom sends the result to `POST /api/payments/mpesa/callback`.
5. On **success**: backend marks the fine(s) PAID and completes the return (borrow → RETURNED, book copies incremented). Frontend sees `returnStatus: 'returned'` and shows success.
6. On **failure**: backend marks the payment request FAILED. Frontend sees `paymentStatus: 'failed'` and shows an error.

## Currency (KES)

- Fine configuration **daily rate** is in **KES** (default 50 = KES 50 per day).
- All fine amounts and UI labels use **KES** (or “KSh” where applicable).
- STK push amount is sent as a whole number (KES).

## If M-Pesa is not configured

If `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_PASSKEY` are missing, the backend will respond with an error when a student tries to return a book that has a fine. Students can still return books **without** fines; admins/librarians can still process returns and record manual payments.

## Database

The `payment_requests` table stores each STK attempt (`checkoutRequestId`, `borrowId`, `fineIds`, `amount`, `status`, etc.). Run migrations so this table exists:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```
