package com.fintrack.repository;

import com.fintrack.entity.Fine;
import com.fintrack.entity.enums.FineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByCarId(Long carId);
    List<Fine> findByCarIdAndStatus(Long carId, FineStatus status);
    Optional<Fine> findByIdAndCarId(Long id, Long carId);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.car.id = :carId AND f.status = 'UNPAID'")
    BigDecimal sumUnpaidFinesByCarId(@Param("carId") Long carId);
}
