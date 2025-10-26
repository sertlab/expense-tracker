import { handlerPath } from '../lib/handler-resolver';

export default {
  getUserProfile: {
    handler: `${handlerPath(__dirname)}/get-user-profile/handler.handler`,
  },
};
