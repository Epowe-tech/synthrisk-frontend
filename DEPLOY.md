# SynthRisk Frontend Deployment

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local development:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Environment configuration
Create a `.env` file in the repo root or set environment variables in your host.

Example `.env`:
```env
VITE_API_BASE_URL=https://pk0hs5sip3.execute-api.us-east-2.amazonaws.com
```

This repo reads the API base URL from `import.meta.env.VITE_API_BASE_URL` and falls back to the provided API Gateway URL.

## Cognito and AWS Amplify
The frontend uses AWS Cognito through `src/aws-exports.js`.

Current Cognito settings:
- Region: `us-east-2`
- User Pool: `us-east-2_QKao16jBM`
- App Client: `386h4fga4hqjp9l6nmfd35kqu9`

If you change the user pool or app client, update `src/aws-exports.js` accordingly.

## Production hosting
You can deploy the built app as static files to any host that supports SPA routing, such as:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Static website hosting on AWS Amplify

Be sure to configure environment variables for `VITE_API_BASE_URL` in the hosting service.

## Notes for backend integration
This frontend now includes placeholders for backend API wiring using the following routes:
- `POST /drafts`
- `GET /drafts`
- `DELETE /drafts/{draftId}`
- `POST /submissions`
- `POST /markets/send`

Adjust the route paths in `src/SynthRisk.jsx` to match your real Lambda/API Gateway endpoints.
