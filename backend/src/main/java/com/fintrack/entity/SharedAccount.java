package com.fintrack.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shared_accounts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "account_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SharedAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private FamilyGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "shared_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime sharedAt = LocalDateTime.now();
}
