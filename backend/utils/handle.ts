import { Request, Response, RequestHandler } from 'express';

export type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

export const handle = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
};
