import createDeployment from './createDeployment';

export default [
  ...createDeployment({
    namespace: 'readable-email',
    name: 'readable-email-bot',
    containerPort: 5678,
    replicaCount: 1,
    image: `hashicorp/http-echo`,
    container: {
      args: [
        "-text=To deploy your app, follow the instructions in the README and let CircleCI do it's thing.",
      ],
    },
  }),
];
