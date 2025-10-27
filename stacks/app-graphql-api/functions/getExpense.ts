import type { AWS } from '@serverless/typescript';

const getExpense: AWS['functions'] = {
  getExpense: {
    handler: 'src/functions/get-expense/index.main',
  },
};

export default getExpense;
