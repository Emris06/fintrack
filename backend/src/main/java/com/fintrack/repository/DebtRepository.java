package com.fintrack.repository;

import com.fintrack.entity.Debt;
import com.fintrack.entity.enums.DebtStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {

    List<Debt> findByUserIdAndIsDeletedFalse(Long userId);

    Optional<Debt> findByIdAndUserIdAndIsDeletedFalse(Long id, Long userId);

    List<Debt> findByUserIdAndStatusAndIsDeletedFalse(Long userId, DebtStatus status);

    /**
     * Finds overdue debts for a user: OPEN status with due date before the given date.
     */
    @Query("SELECT d FROM Debt d " +
           "WHERE d.user.id = :userId " +
           "AND d.dueDate < :today " +
           "AND d.status = 'OPEN' " +
           "AND d.isDeleted = false")
    List<Debt> findOverdueDebtsByUserId(
            @Param("userId") Long userId,
            @Param("today") LocalDate today);

    /**
     * Finds debts with a due date within the specified range and status OPEN (for reminders).
     */
    @Query("SELECT d FROM Debt d " +
           "WHERE d.dueDate BETWEEN :dateFrom AND :dateTo " +
           "AND d.status = 'OPEN' " +
           "AND d.isDeleted = false")
    List<Debt> findDebtsWithDueDateBetweenAndStatusOpen(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);
}
