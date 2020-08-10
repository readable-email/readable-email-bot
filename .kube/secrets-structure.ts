import createSecret from './createSecrets';

// To set secrets:
//   - create `secrets.ts` in this folder
//   - run `jskube .kube/secrets.ts`
//   - delete `secrets.ts`
// The code for `secrets.ts` is in 1password
interface Secrets {
  BUCKET: string;
  /**
   * MongoDB
   */
  DATABASE: string;
  /**
   * Postgres
   */
  // DATABASE_URL: string;
}
export default function secrets(production: Secrets) {
  return [
    createSecret({
      name: 'readable-email-bot',
      namespace: 'readable-email',
      data: production as any,
    }),
  ];
}
