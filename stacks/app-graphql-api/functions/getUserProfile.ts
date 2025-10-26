import type { AWS } from '@serverless/typescript';

const getUserProfile: AWS['functions'] = {
  getUserProfile: {
    handler: 'src/functions/get-user-profile/index.main',
  },
};

export default getUserProfile;
