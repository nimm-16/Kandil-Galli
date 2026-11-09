# Kandil Galli

## Publish on Netlify

The storefront and the order service deploy together. Use a repository import or the Netlify CLI so the makers can see orders from other devices. Uploading only the public folder to Netlify Drop serves the storefront without its order service.

1. Extract the ZIP. Create a GitHub repository and upload the contents of the extracted project folder. At the top of the repository you should see `netlify.toml`, `package.json`, `package-lock.json`, `public/` and `netlify/`.
2. In Netlify select **Add new project → Import an existing project**, choose **GitHub**, and select this repository.
3. Leave the base directory and build command empty. The included configuration sets **public** as the publish directory and **netlify/functions** as the functions directory.
4. Add an environment variable named `MAKERS_PASSWORD`. Use a unique password of at least 16 characters. Make it available to Functions in the Production context. You can also add it in **Project configuration → Environment variables** after the first deploy and then trigger another production deploy.
5. Select **Publish**. Open the production URL supplied by Netlify. From **All kandils**, use the footer link **Makers’ desk** and sign in with your password.
6. Share the production URL. The **QR card** page generates a scannable card for the current site. You can share the link or download a PNG or SVG for printing.

Netlify provisions the project’s Blobs storage when the function writes its first record. Keep deploying updates to the same Netlify project to retain its orders.

[Netlify repository deployment guide](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)

## Deploy from a terminal

Install Node.js 22.12 or newer. Open a terminal in the folder containing `netlify.toml` and run the following commands.

```sh
npm ci
npx netlify-cli@latest login
npx netlify-cli@latest sites:create
npx netlify-cli@latest deploy --prod
```

For an existing Netlify project use `npx netlify-cli@latest link` in place of the creation step. Set the makers’ password in Netlify as described above and redeploy after changing variables. To run locally, use `npx netlify-cli@latest dev`. The local Netlify development environment uses separate Blobs data.

## Order and payment options

**Arrange with makers** works for delivery, pickup and personalised pieces. The shopper chooses full payment or a 30% advance. The order is saved with an outstanding balance. The makers contact the shopper and record the cumulative amount actually received in the desk. Delivery charges are confirmed separately.

**Pay at pickup** works for standard pickup orders paid in full at collection. The maker can mark the balance received. A receipt shows the current order status and outstanding amount. The private receipt link also works on another phone.

**Pay online** appears when the merchant’s Razorpay keys are configured. The shopper places the order, opens their receipt and follows the Razorpay payment link. Razorpay presents the payment methods enabled on the account. The shop never asks shoppers to enter card numbers, CVVs or banking credentials.

### Enable Razorpay

1. Use a separate Netlify test project with Razorpay test keys for your trial. The original catalogue uses proposed prices. Agree the selling prices with the makers before accepting live payments. Update the product list in `public/catalog.js` and the proposed-price labels when prices are final.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as Netlify Functions environment variables. Set a new random `RAZORPAY_WEBHOOK_SECRET` and redeploy.
3. In the matching Razorpay dashboard mode, create a webhook for the event `payment_link.paid`. Use the same webhook secret. Enter your actual production host followed by `/.netlify/functions/market?webhook=1`.
4. Complete one test-mode full payment and one advance. Check the receipt and the makers’ desk amounts. A ₹450 personalised kandil has a ₹135 advance and a ₹315 balance. Closing the gateway without paying leaves the order unpaid. The webhook confirms payments even if the shopper closes the page. Refreshing the receipt also checks the provider.
5. Once approved for live payments, repeat the configuration in your production project using live keys and a live-mode webhook.

[Razorpay Payment Links](https://razorpay.com/docs/api/payments/payment-links/create-standard/)

## Check the shared shop

- On one phone, personalise a kandil, add it to the cart, choose pickup or delivery, and submit using **Arrange with makers**.
- On a separate device, sign in to **Makers’ desk**. Assign the order to a household, change its status, and record a payment. Refresh the shopper’s receipt to see the update.
- From **Bulk and custom**, complete the chat and select **Send enquiry**. Open the desk’s **Bulk enquiries** tab to view it and record a follow-up.
- **Households** holds names and capacity. **Sales log** compares production entries with ordered quantities. **Refresh desk** fetches the latest data. An idle desk also refreshes every 30 seconds.
- To explore the desk before taking orders, choose **Load sample orders**. Samples stay in that browser. Choose **Remove sample orders** when finished.
- Scan the downloaded QR card from another phone before printing it for the stall.
