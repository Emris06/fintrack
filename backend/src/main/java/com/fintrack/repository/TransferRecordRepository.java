package com.fintrack.repository;

import com.fintrack.entity.TransferRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransferRecordRepository extends JpaRepository<TransferRecord, Long> {

    Page<TransferRecord> findByUserId(Long userId, Pageable pageable);

    Optional<TransferRecord> findByIdAndUserId(Long id, Long userId);

    Optional<TransferRecord> findByIdempotencyKey(String key);
}
