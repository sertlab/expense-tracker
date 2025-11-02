import { expenseDataSources } from './expenses';
import { userDataSources } from './users';

export const dataSourceResources = {
  ...expenseDataSources,
  ...userDataSources,
};