import { handlerPath } from '../src/libs/handler-resolver';

export default {
  findExpensesByDate: {
    handler: `${handlerPath(__dirname)}/src/functions/find-expenses-by-date/handler.handler`,
    events: [],
  },
};