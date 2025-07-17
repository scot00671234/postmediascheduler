# Stripe Configuration for Railway Deployment

## Environment Variables Required

When deploying to Railway, you need to configure the following environment variables in your Railway dashboard:

### Server-side (Required)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Your webhook endpoint secret (starts with `whsec_`)

### Client-side (Required)
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe publishable key (starts with `pk_`)

## How to Get Your Keys

1. **Login to Stripe Dashboard**: Visit [https://dashboard.stripe.com/](https://dashboard.stripe.com/)

2. **Get API Keys**:
   - Go to "Developers" → "API Keys"
   - Copy your "Publishable key" (starts with `pk_`)
   - Copy your "Secret key" (starts with `sk_`)

3. **Set up Webhooks** (for subscription management):
   - Go to "Developers" → "Webhooks"
   - Create a new webhook endpoint
   - Use your Railway app URL + `/api/stripe/webhook`
   - Select these events:
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

## Railway Configuration

In your Railway dashboard:

1. Go to your project → "Variables"
2. Add the following variables:
   ```
   STRIPE_SECRET_KEY=sk_live_your_actual_secret_key
   VITE_STRIPE_PUBLIC_KEY=pk_live_your_actual_public_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Testing vs Production

- Use `sk_test_` and `pk_test_` keys for testing
- Use `sk_live_` and `pk_live_` keys for production

## Security Notes

- Never commit real Stripe keys to version control
- The secret key should only be used server-side
- The publishable key is safe to use client-side
- Webhook secrets should be kept secure and only used server-side

## Current Status

The application is configured to use environment variables. If Stripe keys are not configured, the billing features will show a setup required message.