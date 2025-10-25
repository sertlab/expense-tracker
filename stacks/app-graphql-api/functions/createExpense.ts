import type { AWS } from '@serverless/typescript';

const createExpense: AWS['functions'] = {
  createExpense: {
    handler: 'src/functions/create-expense/index.main',
  },
};

export default createExpense;
