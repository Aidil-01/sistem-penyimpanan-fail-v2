#!/usr/bin/env node

// Firebase Token Authentication Script
// Configures Firebase CLI to use token authentication and skip login

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class FirebaseTokenAuth {
    constructor() {
        this.projectId = 'sistem-penyimpanan-fail-tongod';
        this.serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        this.firebaseToken = process.env.FIREBASE_TOKEN;
    }

    async run() {
        console.log('🔧 Firebase Token Authentication Setup');
        console.log('=====================================');

        try {
            // Step 1: Check Firebase CLI
            await this.checkFirebaseCLI();

            // Step 2: Setup authentication
            await this.setupAuthentication();

            // Step 3: Configure project
            await this.configureProject();

            // Step 4: Test authentication
            await this.testAuthentication();

            // Step 5: Deploy with token
            await this.deployWithToken();

            console.log('\n✅ Firebase token authentication setup completed successfully!');
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    }

    async checkFirebaseCLI() {
        console.log('\n📋 1. Checking Firebase CLI...');
        
        return new Promise((resolve, reject) => {
            exec('firebase --version', (error, stdout, stderr) => {
                if (error) {
                    console.log('Installing Firebase CLI...');
                    exec('npm install -g firebase-tools', (installError, installStdout, installStderr) => {
                        if (installError) {
                            reject(new Error('Failed to install Firebase CLI'));
                        } else {
                            console.log('✅ Firebase CLI installed');
                            resolve();
                        }
                    });
                } else {
                    console.log(`✅ Firebase CLI version: ${stdout.trim()}`);
                    resolve();
                }
            });
        });
    }

    async setupAuthentication() {
        console.log('\n📋 2. Setting up authentication...');

        if (this.serviceAccountPath && fs.existsSync(this.serviceAccountPath)) {
            console.log('✅ Using service account authentication');
            console.log(`Service account: ${this.serviceAccountPath}`);
            return;
        }

        if (this.firebaseToken) {
            console.log('✅ Using Firebase token authentication');
            return;
        }

        // Generate token if none provided
        console.log('Generating Firebase token...');
        return new Promise((resolve, reject) => {
            exec('firebase login:ci --no-localhost', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('Failed to generate Firebase token. Run: firebase login:ci'));
                } else {
                    const tokenMatch = stdout.match(/1\/\/[A-Za-z0-9_-]+/);
                    if (tokenMatch) {
                        console.log('✅ Firebase token generated');
                        console.log('💡 Add this to your environment: FIREBASE_TOKEN=' + tokenMatch[0]);
                        resolve();
                    } else {
                        reject(new Error('Could not extract token from output'));
                    }
                }
            });
        });
    }

    async configureProject() {
        console.log('\n📋 3. Configuring Firebase project...');

        const command = this.buildFirebaseCommand('use', [this.projectId]);
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Failed to configure project: ${stderr}`));
                } else {
                    console.log(`✅ Project configured: ${this.projectId}`);
                    resolve();
                }
            });
        });
    }

    async testAuthentication() {
        console.log('\n📋 4. Testing authentication...');

        const command = this.buildFirebaseCommand('projects:list');
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Authentication test failed: ${stderr}`));
                } else {
                    console.log('✅ Authentication successful');
                    if (stdout.includes(this.projectId)) {
                        console.log(`✅ Project ${this.projectId} accessible`);
                    }
                    resolve();
                }
            });
        });
    }

    async deployWithToken() {
        console.log('\n📋 5. Testing deployment...');

        // Build the project first
        console.log('Building project...');
        await this.buildProject();

        // Deploy hosting
        const command = this.buildFirebaseCommand('deploy', ['--only', 'hosting']);
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ Deployment test failed (this is expected in CI)');
                    console.log('Command that would be used:', command);
                    resolve(); // Don't fail on deployment test
                } else {
                    console.log('✅ Deployment successful');
                    resolve();
                }
            });
        });
    }

    async buildProject() {
        return new Promise((resolve, reject) => {
            exec('npm run build', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Build failed: ${stderr}`));
                } else {
                    console.log('✅ Project built successfully');
                    resolve();
                }
            });
        });
    }

    buildFirebaseCommand(action, args = []) {
        let command = `firebase ${action}`;
        
        if (args.length > 0) {
            command += ' ' + args.join(' ');
        }

        // Add authentication flags
        if (this.serviceAccountPath) {
            process.env.GOOGLE_APPLICATION_CREDENTIALS = this.serviceAccountPath;
        } else if (this.firebaseToken) {
            command += ` --token ${this.firebaseToken}`;
        }

        // Add common flags
        command += ' --non-interactive';
        command += ` --project ${this.projectId}`;

        return command;
    }

    showUsage() {
        console.log(`
🔧 Firebase Token Authentication

Usage:
  node firebase-token-auth.js

Environment Variables:
  FIREBASE_TOKEN                    - Firebase CI token
  GOOGLE_APPLICATION_CREDENTIALS   - Path to service account JSON

Examples:
  # Using Firebase token
  FIREBASE_TOKEN=your_token node firebase-token-auth.js

  # Using service account
  GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node firebase-token-auth.js

Commands generated:
  firebase use --token $FIREBASE_TOKEN --non-interactive --project ${this.projectId}
  firebase deploy --only hosting --token $FIREBASE_TOKEN --non-interactive --project ${this.projectId}
        `);
    }
}

// Run if called directly
if (require.main === module) {
    const tokenAuth = new FirebaseTokenAuth();
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        tokenAuth.showUsage();
        process.exit(0);
    }

    tokenAuth.run().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = FirebaseTokenAuth;