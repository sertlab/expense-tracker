import type { AWS } from '@serverless/typescript';

const updateUserProfile: AWS['functions'] = {
  updateUserProfile: {
    handler: 'src/functions/update-user-profile/index.main',
  },
};

export default updateUserProfile;
