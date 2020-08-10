import createIngress from './createIngress';
import createConfigMap from './createConfigMap';

// reusing service account & namespace from main website
// the bot does not have a staging account
export default [
  ...createIngress({
    name: 'readable-email-bot',
    namespace: 'readable-email',
    serviceName: 'readable-email-bot',
    hosts: ['bot.readable-email.org'],
    createCertificate: true,
    enableTLS: false,
    stagingTLS: true,
  }),

  createConfigMap({
    name: 'readable-email-bot',
    namespace: 'readable-email',
    data: {
      NODE_ENV: 'production',
    },
  }),
];
