import app from '../server/index.ts';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default app;
