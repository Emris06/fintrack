package com.fintrack.repository;

import com.fintrack.entity.Bill;
import com.fintrack.entity.enums.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByServiceIdOrderByDueDateDesc(Long serviceId);

    Optional<Bill> findByIdAndServiceId(Long id, Long serviceId);

    List<Bill> findByServiceIdAndStatus(Long serviceId, BillStatus status);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Bill b WHERE b.service.id = :serviceId AND b.status = 'PENDING'")
    BigDecimal sumPendingByServiceId(@Param("serviceId") Long serviceId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Bill b WHERE b.service.house.id = :houseId AND b.status = 'PENDING'")
    BigDecimal sumPendingByHouseId(@Param("houseId") Long houseId);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.service.house.id = :houseId AND b.status = 'PENDING'")
    int countPendingByHouseId(@Param("houseId") Long houseId);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.service.id = :serviceId AND b.status = 'PENDING'")
    int countPendingByServiceId(@Param("serviceId") Long serviceId);
}
