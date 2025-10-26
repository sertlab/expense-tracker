# Identity & Access Management Stack

Cognito User Pool with email-based authentication for the Expense Tracker application.

## Features

- **Email Sign-In**: Users authenticate with email and password
- **Hosted UI**: Pre-built login/signup pages with Authorization Code + PKCE flow
- **Public SPA Client**: No client secret (suitable for single-page applications)
- **Password Policy**: Enforces strong passwords (8+ chars, upper, lower, numbers, symbols)
- **Email Verification**: Auto-verified email addresses
- **Account Recovery**: Password reset via email

## Deployment

### Deploy to AWS

```bash
# Deploy to dev stage
npx nx deploy identity-access-management

# Or from stack directory
cd stacks/identity-access-management
serverless deploy --stage dev

# Deploy to other stages
serverless deploy --stage staging
serverless deploy --stage prod
```

### View Deployment Info

```bash
npx nx info identity-access-management

# Or
cd stacks/identity-access-management
serverless info --stage dev
```

### Remove Stack

```bash
npx nx remove identity-access-management
```

## Outputs

After deployment, you'll get:

- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: App Client ID for your frontend
- **HostedUiDomain**: Hosted UI URL (e.g., `https://expense-tracker-dev.auth.eu-west-2.amazoncognito.com`)
- **UserPoolArn**: User Pool ARN for IAM policies

## Configuration

### User Pool Settings

- **Username**: Email address
- **Auto-verified attributes**: Email
- **Password policy**: Minimum 8 characters with uppercase, lowercase, numbers, and symbols
- **Token validity**:
  - Access token: 60 minutes
  - ID token: 60 minutes
  - Refresh token: 30 days

### App Client Settings

- **Type**: Public (no client secret)
- **Auth flows**:
  - `ALLOW_USER_SRP_AUTH` (Secure Remote Password)
  - `ALLOW_REFRESH_TOKEN_AUTH`
- **OAuth flows**: Authorization Code with PKCE
- **OAuth scopes**: `email`, `openid`, `profile`
- **Callback URLs**:
  - `http://localhost:4200/callback`
  - `http://localhost:3000/callback`
  - `https://localhost:4200/callback`
- **Logout URLs**:
  - `http://localhost:4200`
  - `http://localhost:3000`
  - `https://localhost:4200`

### Updating Callback URLs

For production deployment, update the callback URLs in `resources/cognito.ts`:

```typescript
CallbackURLs: [
  'http://localhost:4200/callback',
  'https://your-production-domain.com/callback',
],
LogoutURLs: [
  'http://localhost:4200',
  'https://your-production-domain.com',
],
```

## Testing

### 1. Access Hosted UI

Get your Hosted UI domain from deployment outputs, then navigate to:

```
https://expense-tracker-dev.auth.eu-west-2.amazoncognito.com/login?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:4200/callback
```

Replace `YOUR_CLIENT_ID` with the value from `UserPoolClientId` output.

### 2. Create Test User via AWS Console

1. Go to [AWS Cognito Console](https://eu-west-2.console.aws.amazon.com/cognito/v2/idp/user-pools)
2. Select your User Pool (`expense-tracker-users-dev`)
3. Click **Users** → **Create user**
4. Enter email and temporary password
5. User will be prompted to change password on first login

### 3. Create Test User via AWS CLI

```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --region eu-west-2
```

### 4. Sign In Flow

1. Navigate to Hosted UI login page
2. Sign in with email and password
3. Complete new password challenge (if first login)
4. Redirected to callback URL with authorization code
5. Exchange code for tokens (handled by your frontend)

## Integration with Frontend

### Environment Variables

```env
VITE_USER_POOL_ID=eu-west-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=https://expense-tracker-dev.auth.eu-west-2.amazoncognito.com
VITE_REDIRECT_URI=http://localhost:4200/callback
```

### Using AWS Amplify (Recommended)

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_XXXXXXXXX',
      userPoolClientId: 'xxxxxxxxxxxxxxxxxxxx',
      loginWith: {
        oauth: {
          domain: 'expense-tracker-dev.auth.eu-west-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:4200/callback'],
          redirectSignOut: ['http://localhost:4200'],
          responseType: 'code',
        },
      },
    },
  },
});
```

### Manual Implementation

1. Redirect to Hosted UI for login
2. Receive authorization code via callback
3. Exchange code for tokens using Cognito Token endpoint
4. Store tokens securely
5. Use ID token to authenticate with AppSync/API Gateway

## Security Considerations

- **HTTPS Required**: Always use HTTPS in production callback URLs
- **PKCE Flow**: Authorization Code with PKCE prevents authorization code interception
- **No Client Secret**: Public SPA client doesn't require secret (can't be kept secret in browser)
- **Token Storage**: Store tokens securely (httpOnly cookies recommended for production)
- **Token Validation**: Always validate ID tokens on the backend

## Common Tasks

### Add Custom Attributes

Edit `resources/cognito.ts` and add to `Schema`:

```typescript
{
  Name: 'phone_number',
  AttributeDataType: 'String',
  Required: false,
  Mutable: true,
}
```

### Enable MFA

Add to User Pool properties in `resources/cognito.ts`:

```typescript
MfaConfiguration: 'OPTIONAL',
EnabledMfas: ['SOFTWARE_TOKEN_MFA'],
```

### Add Social Identity Providers

1. Configure identity provider in AWS Console
2. Add to `SupportedIdentityProviders` in User Pool Client

## Cost Considerations

- **Free tier**: 50,000 MAUs (Monthly Active Users)
- **Beyond free tier**: $0.0055 per MAU
- **Hosted UI**: Included at no additional cost

For typical development/testing: ~$0/month
