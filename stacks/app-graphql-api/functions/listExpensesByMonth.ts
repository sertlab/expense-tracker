import type { AWS } from '@serverless/typescript';

const listExpensesByMonth: AWS['functions'] = {
  listExpensesByMonth: {
    handler: 'src/functions/list-expenses-by-month/index.main',
  },
};

export default listExpensesByMonth;
