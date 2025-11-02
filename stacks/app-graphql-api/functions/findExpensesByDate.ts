import type { AWS } from '@serverless/typescript';

const findExpensesByDate: AWS['functions'] = {
  findExpensesByDate: {
    handler: 'src/functions/find-expenses-by-date/index.main',
  },
};

export default findExpensesByDate;