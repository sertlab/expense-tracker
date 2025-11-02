import { handlerPath } from '@libs/handler-resolver';

export default {
  findExpensesByDate: {
    handler: `${handlerPath(__dirname)}/src/functions/find-expenses-by-date/handler.main`,
    events: [],
  },
};