import type { AWS } from '@serverless/typescript';

const listAllExpensesByMonth: AWS['functions'] = {
  listAllExpensesByMonth: {
    handler: 'src/functions/list-all-expenses-by-month/index.main',
  },
};

export default listAllExpensesByMonth;
