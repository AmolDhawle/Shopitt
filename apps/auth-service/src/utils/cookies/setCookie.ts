import { Response } from 'express';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'lax' | 'strict' | 'none';
  } = {},
) => {
  const cookieOptions = {
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? process.env.NODE_ENV === 'production',
    sameSite:
      options.sameSite ??
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    maxAge: options.maxAge,
    path: options.path ?? '/',
  };

  res.cookie(name, value, cookieOptions);
};
