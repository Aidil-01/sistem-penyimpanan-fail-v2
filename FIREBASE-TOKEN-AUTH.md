# 🔑 Firebase Token Authentication & Skip Login Setup

## 📋 Overview

This setup enables Firebase authentication using tokens and skip-login functionality for the Sistem Penyimpanan Fail Tongod project.

## 🚀 Features

- ✅ **Token-based authentication** - No interactive login required
- ✅ **Skip login functionality** - Automatic authentication for returning users
- ✅ **Service account support** - Enterprise-grade authentication
- ✅ **GitHub Actions integration** - Seamless CI/CD deployment
- ✅ **Fallback mechanisms** - Graceful degradation to standard auth
- ✅ **Windows & Unix support** - Cross-platform compatibility

## 📁 Files Created

### GitHub Actions Workflow
- `.github/workflows/firebase-auth-deploy.yml` - Token-based deployment workflow

### Authentication Scripts
- `firebase-token-auth.js` - Node.js token authentication script
- `firebase-token-auth.bat` - Windows batch script
- `firebase-conversion/js/auth-token-config.js` - Frontend token auth manager

### Documentation
- `FIREBASE-TOKEN-AUTH.md` - This documentation file

## 🛠️ Setup Instructions

### Method 1: Automated Setup (Recommended)

#### Windows:
```batch
firebase-token-auth.bat
```

#### Linux/macOS:
```bash
chmod +x firebase-token-auth.js
node firebase-token-auth.js
```

### Method 2: Manual Setup

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Generate Firebase Token
```bash
firebase login:ci --no-localhost
```
Save the generated token as `FIREBASE_TOKEN` environment variable.

#### Step 3: Configure Project
```bash
firebase use sistem-penyimpanan-fail-tongod --token $FIREBASE_TOKEN
```

#### Step 4: Test Authentication
```bash
firebase projects:list --token $FIREBASE_TOKEN
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_TOKEN` | Firebase CI token | Yes (if not using service account) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | Yes (if not using token) |

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `skip-login` | Enable automatic token authentication | `?skip-login=true` |

### Local Storage

| Key | Description |
|-----|-------------|
| `firebaseAuthToken` | Stored authentication token |
| `skipLogin` | Skip login preference |

## 🎯 Usage Examples

### 1. GitHub Actions Deployment

The workflow automatically uses token authentication:

```yaml
- name: Deploy with token
  run: |
    firebase deploy --only hosting --project sistem-penyimpanan-fail-tongod --non-interactive
  env:
    GOOGLE_APPLICATION_CREDENTIALS: $HOME/firebase-service-account.json
```

### 2. Local Development

```bash
# Set token environment variable
export FIREBASE_TOKEN="your_firebase_token"

# Run deployment
firebase deploy --only hosting --token $FIREBASE_TOKEN --project sistem-penyimpanan-fail-tongod
```

### 3. Frontend Integration

```javascript
// Enable skip-login
tokenAuthManager.enableSkipLogin();

// Check authentication status
const status = tokenAuthManager.getAuthStatus();
console.log('Auth method:', status.authMethod);
```

## 📊 Authentication Methods

### 1. Token Authentication
- **Use case**: CI/CD pipelines, automated deployments
- **Setup**: `firebase login:ci`
- **Benefits**: No interactive login, secure, revocable

### 2. Service Account Authentication  
- **Use case**: Server environments, production deployments
- **Setup**: Download service account JSON from Firebase Console
- **Benefits**: Enterprise-grade security, fine-grained permissions

### 3. Standard Authentication
- **Use case**: Local development, manual operations
- **Setup**: `firebase login`
- **Benefits**: Interactive, easy to setup

## 🔍 Troubleshooting

### Common Issues

#### 1. "Permission denied" error
```bash
# Solution: Check project permissions
firebase projects:list --token $FIREBASE_TOKEN
```

#### 2. "Invalid token" error
```bash
# Solution: Generate new token
firebase login:ci --no-localhost
```

#### 3. "Service account not found"
```bash
# Solution: Verify file path
echo $GOOGLE_APPLICATION_CREDENTIALS
ls -la $GOOGLE_APPLICATION_CREDENTIALS
```

#### 4. Skip-login not working
```javascript
// Solution: Clear stored data
localStorage.removeItem('firebaseAuthToken');
localStorage.removeItem('skipLogin');
```

### Debug Commands

```bash
# Check Firebase CLI version
firebase --version

# List available projects
firebase projects:list

# Check current project
firebase use

# Validate service account
firebase auth:export test.json --project sistem-penyimpanan-fail-tongod
```

## 🔒 Security Considerations

### Token Security
- ✅ Store tokens securely in environment variables
- ✅ Use GitHub Secrets for CI/CD
- ✅ Rotate tokens regularly
- ❌ Never commit tokens to source code

### Service Account Security
- ✅ Use least privilege principle
- ✅ Store JSON files securely
- ✅ Monitor access logs
- ❌ Never expose service account files

### Frontend Security
- ✅ Validate tokens before use
- ✅ Clear tokens on logout
- ✅ Implement session timeouts
- ❌ Store sensitive data in localStorage

## 📈 Performance Benefits

### Before (Standard Auth)
- ⏱️ Manual login required
- 🔄 Session timeouts
- 👤 User intervention needed
- 📱 Multiple authentication steps

### After (Token Auth)
- ⚡ Automatic authentication
- 🔄 Persistent sessions
- 🤖 No user intervention
- 📱 Single-step authentication

## 🧪 Testing

### Unit Tests
```bash
# Test authentication flow
npm test -- --grep "auth"

# Test token validation
npm test -- --grep "token"
```

### Integration Tests
```bash
# Test full deployment pipeline
npm run test:integration

# Test skip-login functionality
npm run test:skip-login
```

### Manual Testing
1. Clear browser localStorage
2. Visit site with `?skip-login=true`
3. Verify automatic authentication
4. Check authentication method indicator

## 📋 Commands Reference

### Firebase CLI with Token
```bash
# Use project
firebase use PROJECT_ID --token $FIREBASE_TOKEN

# Deploy hosting
firebase deploy --only hosting --token $FIREBASE_TOKEN

# Deploy Firestore rules
firebase deploy --only firestore:rules --token $FIREBASE_TOKEN

# List projects
firebase projects:list --token $FIREBASE_TOKEN
```

### Service Account Authentication
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Use project (no token needed)
firebase use PROJECT_ID

# Deploy (no token needed)
firebase deploy --only hosting
```

## 🎯 Next Steps

1. **Test the authentication workflow**
   ```bash
   node firebase-token-auth.js
   ```

2. **Update GitHub Actions secrets**
   - Add `FIREBASE_SERVICE_ACCOUNT_SISTEM_PENYIMPANAN_FAIL_TONGOD`
   - Or add `FIREBASE_TOKEN`

3. **Test deployment**
   ```bash
   npm run build
   firebase deploy --only hosting --token $FIREBASE_TOKEN
   ```

4. **Monitor authentication logs**
   - Check Firebase Console → Authentication → Users
   - Monitor activity logs in Firestore

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Run the troubleshooting commands
3. Check Firebase Console logs
4. Verify environment variables
5. Test with a fresh token

## 🎉 Success Indicators

You'll know the setup is working when:

- ✅ `firebase projects:list` shows your project
- ✅ GitHub Actions deploys without login prompts
- ✅ Frontend shows "🔑 Token Auth" indicator
- ✅ No interactive authentication required
- ✅ Deployment completes successfully

---

**🔧 Setup completed by Claude Code**  
**📅 Date: ${new Date().toISOString().split('T')[0]}**  
**🎯 Project: Sistem Penyimpanan Fail Tongod**