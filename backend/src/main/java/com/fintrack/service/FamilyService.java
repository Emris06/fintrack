package com.fintrack.service;

import com.fintrack.dto.request.FamilyGroupRequest;
import com.fintrack.dto.request.InviteMemberRequest;
import com.fintrack.dto.response.FamilyGroupResponse;
import com.fintrack.dto.response.FamilyMemberResponse;
import com.fintrack.dto.response.SharedAccountResponse;
import com.fintrack.entity.*;
import com.fintrack.entity.enums.FamilyRole;
import com.fintrack.entity.enums.NotificationType;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final SharedAccountRepository sharedAccountRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final NotificationService notificationService;

    public FamilyGroupResponse createGroup(Long userId, FamilyGroupRequest request) {
        log.info("Creating family group '{}' for user id: {}", request.getName(), userId);

        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        FamilyGroup group = FamilyGroup.builder()
                .name(request.getName())
                .owner(owner)
                .build();
        group = familyGroupRepository.save(group);

        // Add owner as OWNER member
        FamilyMember ownerMember = FamilyMember.builder()
                .group(group)
                .user(owner)
                .role(FamilyRole.OWNER)
                .build();
        familyMemberRepository.save(ownerMember);

        log.info("Family group '{}' created with id: {}", group.getName(), group.getId());
        return mapToGroupResponse(group, 1);
    }

    @Transactional(readOnly = true)
    public List<FamilyGroupResponse> getMyGroups(Long userId) {
        log.debug("Fetching groups for user id: {}", userId);

        List<FamilyGroup> groups = familyGroupRepository.findByMemberUserId(userId);

        return groups.stream()
                .map(group -> {
                    int memberCount = familyMemberRepository.findByGroupId(group.getId()).size();
                    return mapToGroupResponse(group, memberCount);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberResponse> getGroupMembers(Long userId, Long groupId) {
        log.debug("Fetching members for group id: {} by user id: {}", groupId, userId);
        ensureMembership(userId, groupId);

        return familyMemberRepository.findByGroupId(groupId).stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    public FamilyMemberResponse inviteMember(Long userId, Long groupId, InviteMemberRequest request) {
        log.info("User {} inviting {} to group {}", userId, request.getEmail(), groupId);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyGroup", "id", groupId));
        ensureMembership(userId, groupId);

        User invitee = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (familyMemberRepository.existsByGroupIdAndUserId(groupId, invitee.getId())) {
            throw new IllegalArgumentException("User is already a member of this group");
        }

        FamilyMember member = FamilyMember.builder()
                .group(group)
                .user(invitee)
                .role(FamilyRole.MEMBER)
                .build();
        member = familyMemberRepository.save(member);

        // Notify the invitee
        User inviter = userRepository.findById(userId)
                .orElse(null);
        String inviterName = inviter != null ? inviter.getFullName() : "Someone";
        notificationService.createNotification(
                invitee.getId(),
                NotificationType.SYSTEM,
                "Added to family group: " + group.getName(),
                inviterName + " added you to the family group \"" + group.getName() + "\".");

        log.info("User {} added to group {}", invitee.getEmail(), groupId);
        return mapToMemberResponse(member);
    }

    public void removeMember(Long userId, Long groupId, Long memberId) {
        log.info("User {} removing member {} from group {}", userId, memberId, groupId);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyGroup", "id", groupId));

        if (!group.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the group owner can remove members");
        }

        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyMember", "id", memberId));

        if (member.getRole() == FamilyRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the group owner");
        }

        familyMemberRepository.delete(member);
        log.info("Member {} removed from group {}", memberId, groupId);
    }

    public void leaveGroup(Long userId, Long groupId) {
        log.info("User {} leaving group {}", userId, groupId);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyGroup", "id", groupId));

        if (group.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Group owner cannot leave. Transfer ownership or delete the group.");
        }

        FamilyMember member = familyMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyMember", "groupId+userId", groupId));

        familyMemberRepository.delete(member);
        log.info("User {} left group {}", userId, groupId);
    }

    public void deleteGroup(Long userId, Long groupId) {
        log.info("User {} deleting group {}", userId, groupId);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyGroup", "id", groupId));

        if (!group.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the group owner can delete the group");
        }

        // Remove all shared accounts and members first
        sharedAccountRepository.findByGroupId(groupId).forEach(sharedAccountRepository::delete);
        familyMemberRepository.findByGroupId(groupId).forEach(familyMemberRepository::delete);
        familyGroupRepository.delete(group);

        log.info("Group {} deleted", groupId);
    }

    @Transactional(readOnly = true)
    public List<SharedAccountResponse> getSharedAccounts(Long userId, Long groupId) {
        log.debug("Fetching shared accounts for group id: {}", groupId);
        ensureMembership(userId, groupId);

        return sharedAccountRepository.findByGroupId(groupId).stream()
                .map(this::mapToSharedAccountResponse)
                .collect(Collectors.toList());
    }

    public SharedAccountResponse shareAccount(Long userId, Long groupId, Long accountId) {
        log.info("User {} sharing account {} with group {}", userId, accountId, groupId);
        ensureMembership(userId, groupId);

        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("FamilyGroup", "id", groupId));

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));

        if (sharedAccountRepository.existsByGroupIdAndAccountId(groupId, accountId)) {
            throw new IllegalArgumentException("Account is already shared with this group");
        }

        SharedAccount shared = SharedAccount.builder()
                .group(group)
                .account(account)
                .build();
        shared = sharedAccountRepository.save(shared);

        log.info("Account {} shared with group {}", accountId, groupId);
        return mapToSharedAccountResponse(shared);
    }

    public void unshareAccount(Long userId, Long groupId, Long accountId) {
        log.info("User {} unsharing account {} from group {}", userId, accountId, groupId);
        ensureMembership(userId, groupId);

        SharedAccount shared = sharedAccountRepository.findByGroupIdAndAccountId(groupId, accountId)
                .orElseThrow(() -> new ResourceNotFoundException("SharedAccount", "accountId", accountId));

        // Only the account owner or group owner can unshare
        Account account = shared.getAccount();
        FamilyGroup group = shared.getGroup();
        if (!account.getUser().getId().equals(userId) && !group.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the account owner or group owner can unshare an account");
        }

        sharedAccountRepository.delete(shared);
        log.info("Account {} unshared from group {}", accountId, groupId);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private void ensureMembership(Long userId, Long groupId) {
        if (!familyMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalArgumentException("You are not a member of this group");
        }
    }

    private FamilyGroupResponse mapToGroupResponse(FamilyGroup group, int memberCount) {
        return FamilyGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .ownerName(group.getOwner().getFullName())
                .ownerId(group.getOwner().getId())
                .memberCount(memberCount)
                .createdAt(group.getCreatedAt())
                .build();
    }

    private FamilyMemberResponse mapToMemberResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .fullName(member.getUser().getFullName())
                .email(member.getUser().getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private SharedAccountResponse mapToSharedAccountResponse(SharedAccount shared) {
        Account account = shared.getAccount();
        return SharedAccountResponse.builder()
                .accountId(account.getId())
                .accountName(account.getName())
                .accountType(account.getType().name())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .icon(account.getIcon())
                .color(account.getColor())
                .ownerName(account.getUser().getFullName())
                .sharedAt(shared.getSharedAt())
                .build();
    }
}
