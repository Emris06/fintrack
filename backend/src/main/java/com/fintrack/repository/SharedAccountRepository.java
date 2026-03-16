package com.fintrack.repository;

import com.fintrack.entity.SharedAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedAccountRepository extends JpaRepository<SharedAccount, Long> {

    List<SharedAccount> findByGroupId(Long groupId);

    Optional<SharedAccount> findByGroupIdAndAccountId(Long groupId, Long accountId);

    boolean existsByGroupIdAndAccountId(Long groupId, Long accountId);
}
