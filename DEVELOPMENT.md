# Development Environment Setup

This guide walks you through setting up the development environment for the Aurume Repair application, now migrated to Google Cloud Platform.

## Prerequisites

1.  **Node.js**: v18 or later.
2.  **PostgreSQL**: Local instance or Cloud SQL Proxy.
3.  **Firebase Project**: A Firebase project with Authentication and Storage enabled.
4.  **LINE Developers Account**: For LINE Login and Messaging API.

## Environment Variables (Secrets)

Create a `.env.local` file in the root directory. You will need the following secrets.

### 1. Database
```env
# Connection string to your PostgreSQL database
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
DATABASE_URL="postgresql://postgres:password@localhost:5432/aurumerepair"
```

### 2. Firebase (Client)
Found in Firebase Console -> Project Settings -> General -> Your Apps.
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456..."
```

### 3. Firebase (Server)
Required for the Admin SDK to verify tokens and manage users server-side.
1.  Go to Firebase Console -> Project Settings -> Service accounts.
2.  Generate a new private key.
3.  Flatten the JSON into a single string (remove newlines) or provide the path if running locally.
```env
# For local dev, you can point to the file path if you prefer, 
# but for Cloud Run, this should be the JSON string content.
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
```

### 4. Application
```env
# The base URL of your application.
# For local dev: http://localhost:3000
# For prod: https://your-app.com
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 5. LINE Integration
```env
# From LINE Developers Console -> Messaging API
LINE_CHANNEL_ACCESS_TOKEN="long-token-string..."
LINE_CHANNEL_SECRET="secret-string..."
```

## Database Setup (Clean Start)

Since we are starting clean, we will use Drizzle Kit to push the schema directly to the database.

1.  **Ensure your database is running** and `DATABASE_URL` is correct.
2.  **Push Schema**:
    ```bash
    npx drizzle-kit push
    ```
    This command will inspect your `src/db/schema.ts` and automatically create the tables in your database. No manual migration files are needed for this initial setup.

## LINE Integration Strategy (Dev vs Prod)

Since this is an internal app with distinct Development and Production environments, we recommend using **two separate LINE Channels**.

### 1. Production Environment
-   **Channel Name**: Aurume Repair (Official)
-   **Webhook URL**: `https://your-prod-domain.com/api/webhook/line`
-   **Login Callback**: `https://your-prod-domain.com/login` (if using LINE Login)

### 2. Development Environment
-   **Channel Name**: Aurume Repair DEV
-   **Webhook URL**:
    -   **Option A (Localhost)**: Use [ngrok](https://ngrok.com/) to tunnel your local port 3000.
        -   Run: `ngrok http 3000`
        -   Set Webhook: `https://<ngrok-id>.ngrok-io/api/webhook/line`
    -   **Option B (Cloud Run Dev)**: If you deploy a dev version to Cloud Run.
        -   Set Webhook: `https://dev-service-url.run.app/api/webhook/line`
-   **Secrets**: Use the Channel Secret and Access Token from the **DEV** channel in your local `.env.local`.

## Running Locally

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Access App**: Open `http://localhost:3000`.

## Deployment to Cloud Run

1.  **Build Container**:
    ```bash
    gcloud builds submit --tag gcr.io/your-project/aurumerepair
    ```
2.  **Deploy**:
    ```bash
    gcloud run deploy aurumerepair \
      --image gcr.io/your-project/aurumerepair \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars DATABASE_URL=...,NEXT_PUBLIC_BASE_URL=...
    ```
    *Note: For secrets like `FIREBASE_SERVICE_ACCOUNT_KEY`, it is recommended to use Google Secret Manager and mount them as volumes or environment variables.*
