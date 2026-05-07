export interface InvitationCheckResponse {
      firstName?: string;
      // parentName?: string;
      status: 'INACTIVE' | 'PENDING' | 'ACTIVE';
      message: string;
}
