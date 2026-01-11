# Deployment Guide

## API Deployment (AWS ECR + App Runner)

This API is designed to be dockerized and deployed to AWS.

### 1. Build and Push to AWS ECR

Replace `<AWS_ACCOUNT_ID>` and `<REGION>` with your actual values.

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

# Create a repository (if not exists)
aws ecr create-repository --repository-name trueline-api --region <REGION>

# Build the image
docker build -t trueline-api ./api

# Tag the image
docker tag trueline-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/trueline-api:latest

# Push to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/trueline-api:latest
```

### 2. Deploy to AWS App Runner

1. Go to the **AWS App Runner** console.
2. Click **Create service**.
3. For **Source**, select **Container registry** and then **Amazon ECR**.
4. Choose the `trueline-api` repository and the `latest` tag.
5. In **Deployment settings**, choose **Automatic** if you want App Runner to redeploy when a new image is pushed.
6. In **Configure service**, set the port to `8000`.
7. Review and **Create & Deploy**.

## Mobile App Deployment (Expo Dev Client)

The mobile app is configured to use **Expo Development Builds** (expo-dev-client). This allows you to include custom native modules and better matches the production environment.

### 1. Update Placeholders in `mobile/app.json`

Open `mobile/app.json` and update the following:
- `owner`: Your Expo username.
- `bundleIdentifier` (iOS) & `package` (Android): Unique IDs like `com.yourname.trueline`.
- `extra.eas.projectId`: Run `eas project:init` in the `mobile` folder to link your project and generate this ID.

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```

### 3. Build the Development Client
Since we are using `expo-dev-client`, you must build a "Development Build" first.

**For iOS Simulator:**
```bash
cd mobile
eas build --profile development --platform ios
```

**For Android Emulator:**
```bash
cd mobile
eas build --profile development --platform android
```

### 4. Run Locally
Once the development build is installed on your simulator/emulator:
```bash
npx expo start --dev-client
```
