# Demo deployment

This project can be deployed using any container friendly platform. The examples below use **Render** for the backend and **Vercel** for the frontend, but any equivalent service such as Fly.io, Google Cloud Run, Netlify or an S3+CloudFront setup will work.

## Backend

1. Provision a PostgreSQL database and obtain the connection string.
2. Create a service from the `backend` directory. The Dockerfile already exposes port `3000`.
3. Configure the following environment variables:

```
DATABASE_URL=<postgres connection string>
JWT_SECRET=<jwt secret>
MP_ACCESS_TOKEN=<mercadopago sandbox token>
MP_ALLOWED_IPS=0.0.0.0/0
CORS_ORIGIN=https://demo.example.com
```

## Frontend

1. Deploy the `frontend` directory using a static hosting provider.
2. Set the environment variable used by Vite:

```
VITE_API_BASE_URL=https://your-backend.example.com
```

## Domain

Point your demo domain (for example `demo.miapp.com`) to the frontend hosting provider and enable HTTPS. Netlify and Vercel handle TLS automatically; for other providers use Let's Encrypt.

Use MercadoPago **sandbox** credentials for all demo interactions.
