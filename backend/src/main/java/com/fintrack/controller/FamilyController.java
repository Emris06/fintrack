package com.fintrack.controller;

import com.fintrack.dto.request.FamilyGroupRequest;
import com.fintrack.dto.request.InviteMemberRequest;
import com.fintrack.dto.request.ShareAccountRequest;
import com.fintrack.dto.response.*;
import com.fintrack.service.FamilyService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/groups")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> createGroup(
            @Valid @RequestBody FamilyGroupRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        FamilyGroupResponse result = familyService.createGroup(userId, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<FamilyGroupResponse>>> getMyGroups() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<FamilyGroupResponse> result = familyService.getMyGroups(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/groups/{groupId}/members")
    public ResponseEntity<ApiResponse<List<FamilyMemberResponse>>> getGroupMembers(
            @PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<FamilyMemberResponse> result = familyService.getGroupMembers(userId, groupId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/groups/{groupId}/members")
    public ResponseEntity<ApiResponse<FamilyMemberResponse>> inviteMember(
            @PathVariable Long groupId,
            @Valid @RequestBody InviteMemberRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        FamilyMemberResponse result = familyService.inviteMember(userId, groupId, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/groups/{groupId}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId) {
        Long userId = SecurityUtils.getCurrentUserId();
        familyService.removeMember(userId, groupId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/groups/{groupId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        familyService.leaveGroup(userId, groupId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        familyService.deleteGroup(userId, groupId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/groups/{groupId}/accounts")
    public ResponseEntity<ApiResponse<List<SharedAccountResponse>>> getSharedAccounts(
            @PathVariable Long groupId) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<SharedAccountResponse> result = familyService.getSharedAccounts(userId, groupId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/groups/{groupId}/accounts")
    public ResponseEntity<ApiResponse<SharedAccountResponse>> shareAccount(
            @PathVariable Long groupId,
            @Valid @RequestBody ShareAccountRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        SharedAccountResponse result = familyService.shareAccount(userId, groupId, request.getAccountId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/groups/{groupId}/accounts/{accountId}")
    public ResponseEntity<ApiResponse<Void>> unshareAccount(
            @PathVariable Long groupId,
            @PathVariable Long accountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        familyService.unshareAccount(userId, groupId, accountId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
