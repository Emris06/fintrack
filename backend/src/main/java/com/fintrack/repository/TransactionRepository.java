package com.fintrack.repository;

import com.fintrack.entity.Transaction;
import com.fintrack.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdAndUserIdAndIsDeletedFalse(Long id, Long userId);

    Page<Transaction> findByUserIdAndIsDeletedFalse(Long userId, Pageable pageable);

    /**
     * Filtered transaction search with optional parameters.
     * All filters are optional except userId and date range.
     */
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.isDeleted = false " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:accountId IS NULL OR t.account.id = :accountId) " +
           "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo")
    Page<Transaction> findWithFilters(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("accountId") Long accountId,
            @Param("categoryId") Long categoryId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            Pageable pageable);

    /**
     * Sum of amounts by user, transaction type, and date range (for analytics).
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.type = :type " +
           "AND t.isDeleted = false " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo")
    BigDecimal sumAmountByUserIdAndTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Sum of amounts by user, category, transaction type, and date range (for budget tracking).
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.category.id = :categoryId " +
           "AND t.type = :type " +
           "AND t.isDeleted = false " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo")
    BigDecimal sumAmountByUserIdAndCategoryIdAndTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("type") TransactionType type,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Sum of amounts grouped by category for a user's expense transactions within a date range.
     * Each result row is an Object[] where [0] = Category, [1] = total amount (BigDecimal).
     */
    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.type = 'EXPENSE' " +
           "AND t.isDeleted = false " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "AND t.category IS NOT NULL " +
           "GROUP BY t.category " +
           "ORDER BY SUM(t.amount) DESC")
    List<Object[]> sumAmountGroupedByCategoryForExpense(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Daily totals for a calendar view, grouped by transaction date.
     * Each result row is an Object[] where [0] = transactionDate (LocalDate),
     * [1] = type (TransactionType), [2] = total amount (BigDecimal).
     */
    @Query("SELECT t.transactionDate, t.type, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.isDeleted = false " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "GROUP BY t.transactionDate, t.type " +
           "ORDER BY t.transactionDate ASC")
    List<Object[]> findDailyTotals(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Monthly totals for income and expense between a date range (for trend chart).
     * Each result row is an Object[] where [0] = year (Integer), [1] = month (Integer),
     * [2] = type (TransactionType), [3] = total amount (BigDecimal).
     */
    @Query("SELECT YEAR(t.transactionDate), MONTH(t.transactionDate), t.type, SUM(t.amount) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.isDeleted = false " +
           "AND t.type IN ('INCOME', 'EXPENSE') " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate), t.type " +
           "ORDER BY YEAR(t.transactionDate) ASC, MONTH(t.transactionDate) ASC")
    List<Object[]> findMonthlyTotals(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Weekly totals for income and expense between a date range.
     * Each result row is an Object[] where [0] = year (Integer), [1] = week (Integer),
     * [2] = type (TransactionType), [3] = total amount (BigDecimal).
     */
    @Query("SELECT YEAR(t.transactionDate), FUNCTION('WEEK', t.transactionDate), t.type, SUM(t.amount) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.isDeleted = false " +
           "AND t.type IN ('INCOME', 'EXPENSE') " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "GROUP BY YEAR(t.transactionDate), FUNCTION('WEEK', t.transactionDate), t.type " +
           "ORDER BY YEAR(t.transactionDate) ASC, FUNCTION('WEEK', t.transactionDate) ASC")
    List<Object[]> findWeeklyTotals(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Yearly totals for income and expense between a date range.
     * Each result row is an Object[] where [0] = year (Integer),
     * [1] = type (TransactionType), [2] = total amount (BigDecimal).
     */
    @Query("SELECT YEAR(t.transactionDate), t.type, SUM(t.amount) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.isDeleted = false " +
           "AND t.type IN ('INCOME', 'EXPENSE') " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "GROUP BY YEAR(t.transactionDate), t.type " +
           "ORDER BY YEAR(t.transactionDate) ASC")
    List<Object[]> findYearlyTotals(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    /**
     * Sum of amounts grouped by category for income and expense transactions.
     * Each result row is an Object[] where [0] = Category, [1] = type (TransactionType), [2] = total amount (BigDecimal).
     */
    @Query("SELECT t.category, t.type, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.type IN ('INCOME', 'EXPENSE') " +
           "AND t.isDeleted = false " +
           "AND t.transactionDate >= :dateFrom " +
           "AND t.transactionDate <= :dateTo " +
           "AND t.category IS NOT NULL " +
           "GROUP BY t.category, t.type " +
           "ORDER BY SUM(t.amount) DESC")
    List<Object[]> sumAmountGroupedByCategoryAndType(
            @Param("userId") Long userId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);
}
