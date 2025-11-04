import { resolve } from 'path';

export const handlerPath = (context: string) => {
  return resolve(context);
};