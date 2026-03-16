export interface FamilyGroupResponse {
  id: number;
  name: string;
  ownerName: string;
  ownerId: number;
  memberCount: number;
  createdAt: string;
}

export interface FamilyMemberResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface SharedAccountResponse {
  accountId: number;
  accountName: string;
  accountType: string;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  ownerName: string;
  sharedAt: string;
}

export interface FamilyGroupRequest {
  name: string;
}

export interface InviteMemberRequest {
  email: string;
}

export interface ShareAccountRequest {
  accountId: number;
}
