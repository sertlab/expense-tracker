import type { AWS } from '@serverless/typescript';

const deleteExpense: AWS['functions'] = {
  deleteExpense: {
    handler: 'src/functions/delete-expense/index.main',
  },
};

export default deleteExpense;
