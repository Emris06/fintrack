package com.fintrack.dto.response;

import com.fintrack.entity.enums.FamilyRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private FamilyRole role;
    private LocalDateTime joinedAt;
}
