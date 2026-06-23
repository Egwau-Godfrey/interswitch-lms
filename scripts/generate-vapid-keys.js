const webPush = require('web-push');

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('Add these to your .env.local file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n⚠️  Keep the private key secret! Never commit it to version control.');
