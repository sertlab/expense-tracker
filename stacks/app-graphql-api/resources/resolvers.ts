import { expenseResolvers } from './expenses';
import { userResolvers } from './users';

export const resolverResources = {
  ...expenseResolvers,
  ...userResolvers,
};