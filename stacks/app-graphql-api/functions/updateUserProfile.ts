import { handlerPath } from '../lib/handler-resolver';

export default {
  updateUserProfile: {
    handler: `${handlerPath(__dirname)}/update-user-profile/handler.handler`,
  },
};
