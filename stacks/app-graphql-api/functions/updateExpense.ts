import type { AWS } from '@serverless/typescript';

const updateExpense: AWS['functions'] = {
  updateExpense: {
    handler: 'src/functions/update-expense/index.main',
  },
};

export default updateExpense;
