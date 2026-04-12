import { app, initPromise } from "../server/index";

export default async (req: any, res: any) => {
  await initPromise;
  return app(req, res);
};
