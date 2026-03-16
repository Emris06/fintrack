package com.fintrack.service;

import com.fintrack.dto.request.BudgetRequest;
import com.fintrack.dto.response.BudgetResponse;
import com.fintrack.entity.Budget;
import com.fintrack.entity.Category;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.BudgetPeriod;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.BudgetRepository;
import com.fintrack.repository.CategoryRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    /**
     * Retrieve all active budgets for a user with calculated spending metrics.
     * For each budget, computes spent, remaining, and percentUsed based on the
     * current period's expense transactions in the budget's category.
     *
     * @param userId the owner's user id
     * @return list of BudgetResponse DTOs with spending calculations
     */
    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long userId) {
        log.debug("Fetching all active budgets for user id: {}", userId);

        return budgetRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(budget -> mapToResponseWithSpending(budget, userId))
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a single budget by id with calculated spending metrics.
     *
     * @param userId   the owner's user id
     * @param budgetId the budget id
     * @return BudgetResponse DTO with spending calculations
     */
    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long userId, Long budgetId) {
        log.debug("Fetching budget id: {} for user id: {}", budgetId, userId);

        Budget budget = findBudgetByIdAndUserId(budgetId, userId);
        return mapToResponseWithSpending(budget, userId);
    }

    /**
     * Create a new budget for the specified user.
     *
     * @param userId  the owner's user id
     * @param request the budget creation details
     * @return BudgetResponse DTO with spent initialized to zero
     */
    public BudgetResponse createBudget(Long userId, BudgetRequest request) {
        log.info("Creating new budget '{}' for user id: {}", request.getName(), userId);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Budget budget = Budget.builder()
                .user(User.builder().id(userId).build())
                .category(category)
                .name(request.getName())
                .amountLimit(request.getAmountLimit())
                .currency(request.getCurrency())
                .periodType(request.getPeriodType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        budget = budgetRepository.save(budget);

        log.info("Budget created with id: {} for user id: {}", budget.getId(), userId);

        return BudgetResponse.builder()
                .id(budget.getId())
                .categoryId(category.getId())
                .categoryName(category.getName())
                .name(budget.getName())
                .amountLimit(budget.getAmountLimit())
                .currency(budget.getCurrency())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .isActive(budget.getIsActive())
                .spent(BigDecimal.ZERO)
                .remaining(budget.getAmountLimit())
                .percentUsed(BigDecimal.ZERO)
                .build();
    }

    /**
     * Update an existing budget's mutable fields.
     *
     * @param userId   the owner's user id
     * @param budgetId the budget id to update
     * @param request  the update details
     * @return BudgetResponse DTO with recalculated spending metrics
     */
    public BudgetResponse updateBudget(Long userId, Long budgetId, BudgetRequest request) {
        log.info("Updating budget id: {} for user id: {}", budgetId, userId);

        Budget budget = findBudgetByIdAndUserId(budgetId, userId);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        budget.setCategory(category);
        budget.setName(request.getName());
        budget.setAmountLimit(request.getAmountLimit());
        budget.setCurrency(request.getCurrency());
        budget.setPeriodType(request.getPeriodType());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());

        budget = budgetRepository.save(budget);

        log.info("Budget id: {} updated successfully", budgetId);

        return mapToResponseWithSpending(budget, userId);
    }

    /**
     * Hard-delete a budget. Budgets are not financial records and can be permanently removed.
     *
     * @param userId   the owner's user id
     * @param budgetId the budget id to delete
     */
    public void deleteBudget(Long userId, Long budgetId) {
        log.info("Deleting budget id: {} for user id: {}", budgetId, userId);

        Budget budget = findBudgetByIdAndUserId(budgetId, userId);
        budgetRepository.delete(budget);

        log.info("Budget id: {} deleted successfully", budgetId);
    }

    /**
     * Retrieve all budgets (including inactive) for a user with spending metrics,
     * intended for performance reporting and analytics.
     *
     * @param userId the owner's user id
     * @return list of all BudgetResponse DTOs with spending calculations
     */
    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgetPerformance(Long userId) {
        log.debug("Fetching budget performance for user id: {}", userId);

        return budgetRepository.findByUserId(userId)
                .stream()
                .map(budget -> mapToResponseWithSpending(budget, userId))
                .collect(Collectors.toList());
    }

    /**
     * Calculate the start and end dates for the current period based on the budget's period type.
     *
     * @param budget the budget entity
     * @return a two-element array where [0] = period start date, [1] = period end date
     */
    private LocalDate[] calculatePeriodDates(Budget budget) {
        LocalDate today = LocalDate.now();
        LocalDate periodStart;
        LocalDate periodEnd;

        switch (budget.getPeriodType()) {
            case WEEKLY:
                periodStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                periodEnd = periodStart.plusDays(6);
                break;
            case MONTHLY:
                periodStart = today.withDayOfMonth(1);
                periodEnd = today.with(TemporalAdjusters.lastDayOfMonth());
                break;
            case YEARLY:
                periodStart = today.withDayOfYear(1);
                periodEnd = today.with(TemporalAdjusters.lastDayOfYear());
                break;
            default:
                periodStart = today.withDayOfMonth(1);
                periodEnd = today.with(TemporalAdjusters.lastDayOfMonth());
        }

        return new LocalDate[]{periodStart, periodEnd};
    }

    /**
     * Calculate the total amount spent in a specific category within a date range.
     *
     * @param userId     the owner's user id
     * @param categoryId the category id to filter by
     * @param from       the period start date (inclusive)
     * @param to         the period end date (inclusive)
     * @return total spent as BigDecimal
     */
    private BigDecimal calculateSpent(Long userId, Long categoryId, LocalDate from, LocalDate to) {
        BigDecimal spent = transactionRepository.sumAmountByUserIdAndCategoryIdAndTypeAndDateRange(
                userId, categoryId, TransactionType.EXPENSE, from, to);
        return spent != null ? spent : BigDecimal.ZERO;
    }

    /**
     * Map a Budget entity to a BudgetResponse DTO with calculated spending metrics.
     */
    private BudgetResponse mapToResponseWithSpending(Budget budget, Long userId) {
        LocalDate[] periodDates = calculatePeriodDates(budget);
        Long categoryId = budget.getCategory() != null ? budget.getCategory().getId() : null;
        String categoryName = budget.getCategory() != null ? budget.getCategory().getName() : null;

        BigDecimal spent = BigDecimal.ZERO;
        if (categoryId != null) {
            spent = calculateSpent(userId, categoryId, periodDates[0], periodDates[1]);
        }

        BigDecimal remaining = budget.getAmountLimit().subtract(spent);
        BigDecimal percentUsed = BigDecimal.ZERO;
        if (budget.getAmountLimit().compareTo(BigDecimal.ZERO) > 0) {
            percentUsed = spent
                    .multiply(BigDecimal.valueOf(100))
                    .divide(budget.getAmountLimit(), 2, RoundingMode.HALF_UP);
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .name(budget.getName())
                .amountLimit(budget.getAmountLimit())
                .currency(budget.getCurrency())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .isActive(budget.getIsActive())
                .spent(spent)
                .remaining(remaining)
                .percentUsed(percentUsed)
                .build();
    }

    private Budget findBudgetByIdAndUserId(Long budgetId, Long userId) {
        return budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget", "id", budgetId));
    }
}
