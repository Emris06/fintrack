package com.fintrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyGroupResponse {

    private Long id;
    private String name;
    private String ownerName;
    private Long ownerId;
    private int memberCount;
    private LocalDateTime createdAt;
}
