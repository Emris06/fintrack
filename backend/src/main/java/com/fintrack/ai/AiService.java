package com.fintrack.ai;

import com.fintrack.dto.response.AiInsightResponse;
import com.fintrack.dto.response.CategoryResponse;
import com.fintrack.entity.AiCategoryRule;
import com.fintrack.entity.Budget;
import com.fintrack.entity.Category;
import com.fintrack.entity.Debt;
import com.fintrack.entity.enums.DebtStatus;
import com.fintrack.entity.enums.NotificationType;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.repository.AiCategoryRuleRepository;
import com.fintrack.repository.BudgetRepository;
import com.fintrack.repository.DebtRepository;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Rule-based AI engine that provides category prediction, anomaly detection,
 * financial insight generation, and automated notification creation.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiService {

    private final AiCategoryRuleRepository aiCategoryRuleRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final DebtRepository debtRepository;
    private final NotificationService notificationService;

    private static final BigDecimal ANOMALY_THRESHOLD = new BigDecimal("1.30");
    private static final BigDecimal ANOMALY_CRITICAL_THRESHOLD = new BigDecimal("50.00");
    private static final BigDecimal BUDGET_WARNING_PERCENT = new BigDecimal("80.00");
    private static final BigDecimal BUDGET_EXCEEDED_PERCENT = new BigDecimal("100.00");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final int DEBT_REMINDER_DAYS = 7;

    /**
     * Predict the most likely category for a transaction based on its description.
     * Searches both system-wide rules and user-specific rules, returning the category
     * with the highest confidence match.
     *
     * @param description the transaction description to match against rules
     * @param userId      the user id for user-specific rules
     * @return the best matching CategoryResponse, or null if no rule matches
     */
    @Transactional(readOnly = true)
    public CategoryResponse predictCategory(String description, Long userId) {
        log.debug("Predicting category for description: '{}', user id: {}", description, userId);

        if (description == null || description.isBlank()) {
            log.debug("Empty description provided, returning null");
            return null;
        }

        List<AiCategoryRule> matchingRules = aiCategoryRuleRepository.findMatchingRules(description);

        // Filter to include only system rules (user is null) and rules belonging to this user
        List<AiCategoryRule> applicableRules = matchingRules.stream()
                .filter(rule -> rule.getUser() == null || rule.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        if (applicableRules.isEmpty()) {
            log.debug("No matching rules found for description: '{}'", description);
            return null;
        }

        // Rules are already ordered by confidence DESC from the repository query;
        // the first applicable rule is the best match.
        AiCategoryRule bestMatch = applicableRules.get(0);
        Category category = bestMatch.getCategory();

        log.info("Predicted category '{}' (confidence: {}) for description: '{}'",
                category.getName(), bestMatch.getConfidence(), description);

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .type(category.getType())
                .isSystem(category.getIsSystem())
                .build();
    }

    /**
     * Detect spending anomalies for the current month by comparing each expense category's
     * total against the average of the previous three months. An anomaly is flagged when
     * current spending exceeds the average by more than 30%.
     *
     * @param userId the user id to analyze
     * @return list of anomaly insights, empty if no anomalies detected
     */
    @Transactional(readOnly = true)
    public List<AiInsightResponse> detectAnomalies(Long userId) {
        log.debug("Detecting anomalies for user id: {}", userId);

        LocalDate today = LocalDate.now();
        LocalDate currentMonthStart = today.withDayOfMonth(1);
        LocalDate currentMonthEnd = today.with(TemporalAdjusters.lastDayOfMonth());

        // Get current month spending grouped by category
        List<Object[]> currentMonthData = transactionRepository.sumAmountGroupedByCategoryForExpense(
                userId, currentMonthStart, currentMonthEnd);

        List<AiInsightResponse> anomalies = new ArrayList<>();

        for (Object[] row : currentMonthData) {
            Category category = (Category) row[0];
            BigDecimal currentAmount = (BigDecimal) row[1];

            // Calculate the average of the previous 3 months
            BigDecimal averageAmount = calculatePreviousMonthsAverage(userId, category.getId(), today, 3);

            // Skip categories with no historical data (new spending categories)
            if (averageAmount.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            BigDecimal threshold = averageAmount.multiply(ANOMALY_THRESHOLD);

            if (currentAmount.compareTo(threshold) > 0) {
                BigDecimal percentOver = currentAmount.subtract(averageAmount)
                        .multiply(ONE_HUNDRED)
                        .divide(averageAmount, 2, RoundingMode.HALF_UP);

                String severity = percentOver.compareTo(ANOMALY_CRITICAL_THRESHOLD) > 0
                        ? "CRITICAL" : "WARNING";

                Map<String, Object> data = new HashMap<>();
                data.put("categoryName", category.getName());
                data.put("currentAmount", currentAmount.setScale(4, RoundingMode.HALF_UP));
                data.put("averageAmount", averageAmount.setScale(4, RoundingMode.HALF_UP));
                data.put("percentOver", percentOver);

                AiInsightResponse insight = AiInsightResponse.builder()
                        .type("ANOMALY")
                        .title("Unusual spending in " + category.getName())
                        .message(String.format("Your spending in %s this month ($%s) is %s%% above your 3-month average ($%s).",
                                category.getName(),
                                currentAmount.setScale(2, RoundingMode.HALF_UP),
                                percentOver,
                                averageAmount.setScale(2, RoundingMode.HALF_UP)))
                        .severity(severity)
                        .data(data)
                        .build();

                anomalies.add(insight);
            }
        }

        log.info("Detected {} anomalies for user id: {}", anomalies.size(), userId);
        return anomalies;
    }

    /**
     * Generate a comprehensive list of financial insights for a user by combining
     * anomaly detection results, budget alerts, and debt reminders. Results are
     * sorted by severity (CRITICAL first, then WARNING, then INFO).
     *
     * @param userId the user id to generate insights for
     * @return sorted list of all insights
     */
    @Transactional(readOnly = true)
    public List<AiInsightResponse> generateInsights(Long userId) {
        log.debug("Generating insights for user id: {}", userId);

        List<AiInsightResponse> insights = new ArrayList<>();

        // 1. Anomaly detection
        insights.addAll(detectAnomalies(userId));

        // 2. Budget alerts
        insights.addAll(generateBudgetAlerts(userId));

        // 3. Debt reminders
        insights.addAll(generateDebtReminders(userId));

        // Sort by severity: CRITICAL > WARNING > INFO
        insights.sort(Comparator.comparingInt(this::severityOrder));

        log.info("Generated {} total insights for user id: {}", insights.size(), userId);
        return insights;
    }

    /**
     * Run anomaly detection and budget checks, creating notifications for any new alerts
     * found. This method is intended to be called periodically (e.g., via a scheduler)
     * or triggered after each transaction is created.
     *
     * @param userId the user id to check
     */
    @Transactional
    public void checkAndCreateNotifications(Long userId) {
        log.info("Running notification checks for user id: {}", userId);

        // Anomaly notifications
        List<AiInsightResponse> anomalies = detectAnomalies(userId);
        for (AiInsightResponse anomaly : anomalies) {
            notificationService.createNotification(
                    userId,
                    NotificationType.ANOMALY,
                    anomaly.getTitle(),
                    anomaly.getMessage());
        }

        // Budget alert notifications
        List<AiInsightResponse> budgetAlerts = generateBudgetAlerts(userId);
        for (AiInsightResponse alert : budgetAlerts) {
            NotificationType type = "CRITICAL".equals(alert.getSeverity())
                    ? NotificationType.BUDGET_EXCEEDED
                    : NotificationType.BUDGET_WARNING;

            notificationService.createNotification(
                    userId,
                    type,
                    alert.getTitle(),
                    alert.getMessage());
        }

        // Debt reminder notifications
        List<AiInsightResponse> debtReminders = generateDebtReminders(userId);
        for (AiInsightResponse reminder : debtReminders) {
            notificationService.createNotification(
                    userId,
                    NotificationType.BILL_REMINDER,
                    reminder.getTitle(),
                    reminder.getMessage());
        }

        int total = anomalies.size() + budgetAlerts.size() + debtReminders.size();
        log.info("Created {} notifications for user id: {}", total, userId);
    }

    // -----------------------------------------------------------------------
    // Private helper methods
    // -----------------------------------------------------------------------

    /**
     * Generate budget alerts for all active budgets of a user. A WARNING is issued
     * when spending reaches 80% of the budget limit; CRITICAL when it exceeds 100%.
     */
    private List<AiInsightResponse> generateBudgetAlerts(Long userId) {
        List<Budget> activeBudgets = budgetRepository.findByUserIdAndIsActiveTrue(userId);
        List<AiInsightResponse> alerts = new ArrayList<>();

        for (Budget budget : activeBudgets) {
            if (budget.getCategory() == null) {
                continue;
            }

            LocalDate[] periodDates = calculatePeriodDates(budget);
            BigDecimal spent = transactionRepository.sumAmountByUserIdAndCategoryIdAndTypeAndDateRange(
                    userId, budget.getCategory().getId(), TransactionType.EXPENSE,
                    periodDates[0], periodDates[1]);
            if (spent == null) {
                spent = BigDecimal.ZERO;
            }

            if (budget.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal percentUsed = spent
                    .multiply(ONE_HUNDRED)
                    .divide(budget.getAmountLimit(), 2, RoundingMode.HALF_UP);

            if (percentUsed.compareTo(BUDGET_EXCEEDED_PERCENT) >= 0) {
                Map<String, Object> data = new HashMap<>();
                data.put("budgetName", budget.getName());
                data.put("amountLimit", budget.getAmountLimit());
                data.put("spent", spent);
                data.put("percentUsed", percentUsed);

                alerts.add(AiInsightResponse.builder()
                        .type("BUDGET")
                        .title("Budget exceeded: " + budget.getName())
                        .message(String.format("You have spent $%s of your $%s budget for %s (%s%% used).",
                                spent.setScale(2, RoundingMode.HALF_UP),
                                budget.getAmountLimit().setScale(2, RoundingMode.HALF_UP),
                                budget.getName(),
                                percentUsed))
                        .severity("CRITICAL")
                        .data(data)
                        .build());

            } else if (percentUsed.compareTo(BUDGET_WARNING_PERCENT) >= 0) {
                Map<String, Object> data = new HashMap<>();
                data.put("budgetName", budget.getName());
                data.put("amountLimit", budget.getAmountLimit());
                data.put("spent", spent);
                data.put("percentUsed", percentUsed);

                alerts.add(AiInsightResponse.builder()
                        .type("BUDGET")
                        .title("Budget warning: " + budget.getName())
                        .message(String.format("You have used %s%% of your %s budget ($%s of $%s).",
                                percentUsed,
                                budget.getName(),
                                spent.setScale(2, RoundingMode.HALF_UP),
                                budget.getAmountLimit().setScale(2, RoundingMode.HALF_UP)))
                        .severity("WARNING")
                        .data(data)
                        .build());
            }
        }

        return alerts;
    }

    /**
     * Generate debt reminders for debts that are due within 7 days or overdue.
     */
    private List<AiInsightResponse> generateDebtReminders(Long userId) {
        LocalDate today = LocalDate.now();
        List<AiInsightResponse> reminders = new ArrayList<>();

        // Overdue debts (CRITICAL)
        List<Debt> overdueDebts = debtRepository.findOverdueDebtsByUserId(userId, today);
        for (Debt debt : overdueDebts) {
            Map<String, Object> data = new HashMap<>();
            data.put("debtId", debt.getId());
            data.put("personName", debt.getPersonName());
            data.put("amount", debt.getAmount());
            data.put("dueDate", debt.getDueDate().toString());

            reminders.add(AiInsightResponse.builder()
                    .type("DEBT")
                    .title("Overdue debt: " + debt.getPersonName())
                    .message(String.format("Your debt of $%s to %s was due on %s and is now overdue.",
                            debt.getAmount().setScale(2, RoundingMode.HALF_UP),
                            debt.getPersonName(),
                            debt.getDueDate()))
                    .severity("CRITICAL")
                    .data(data)
                    .build());
        }

        // Debts due within 7 days (WARNING)
        LocalDate reminderEnd = today.plusDays(DEBT_REMINDER_DAYS);
        List<Debt> upcomingDebts = debtRepository.findDebtsWithDueDateBetweenAndStatusOpen(today, reminderEnd);

        // Filter to only this user's debts (the repository query does not filter by user)
        List<Debt> userUpcomingDebts = upcomingDebts.stream()
                .filter(d -> d.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        for (Debt debt : userUpcomingDebts) {
            Map<String, Object> data = new HashMap<>();
            data.put("debtId", debt.getId());
            data.put("personName", debt.getPersonName());
            data.put("amount", debt.getAmount());
            data.put("dueDate", debt.getDueDate().toString());

            long daysUntilDue = java.time.temporal.ChronoUnit.DAYS.between(today, debt.getDueDate());

            reminders.add(AiInsightResponse.builder()
                    .type("DEBT")
                    .title("Upcoming debt payment: " + debt.getPersonName())
                    .message(String.format("Your debt of $%s to %s is due in %d day(s) on %s.",
                            debt.getAmount().setScale(2, RoundingMode.HALF_UP),
                            debt.getPersonName(),
                            daysUntilDue,
                            debt.getDueDate()))
                    .severity("WARNING")
                    .data(data)
                    .build());
        }

        return reminders;
    }

    /**
     * Calculate the average monthly spending for a specific category over the given
     * number of previous months (excluding the current month).
     *
     * @param userId     the user id
     * @param categoryId the category id
     * @param today      the reference date (typically today)
     * @param months     the number of previous months to average
     * @return the average monthly spending, or BigDecimal.ZERO if no data
     */
    private BigDecimal calculatePreviousMonthsAverage(Long userId, Long categoryId,
                                                       LocalDate today, int months) {
        BigDecimal total = BigDecimal.ZERO;
        int monthsWithData = 0;

        for (int i = 1; i <= months; i++) {
            LocalDate monthStart = today.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.with(TemporalAdjusters.lastDayOfMonth());

            BigDecimal monthTotal = transactionRepository.sumAmountByUserIdAndCategoryIdAndTypeAndDateRange(
                    userId, categoryId, TransactionType.EXPENSE, monthStart, monthEnd);

            if (monthTotal != null && monthTotal.compareTo(BigDecimal.ZERO) > 0) {
                total = total.add(monthTotal);
                monthsWithData++;
            }
        }

        if (monthsWithData == 0) {
            return BigDecimal.ZERO;
        }

        return total.divide(BigDecimal.valueOf(monthsWithData), 4, RoundingMode.HALF_UP);
    }

    /**
     * Calculate the start and end dates for a budget's current period.
     */
    private LocalDate[] calculatePeriodDates(Budget budget) {
        LocalDate today = LocalDate.now();
        LocalDate periodStart;
        LocalDate periodEnd;

        switch (budget.getPeriodType()) {
            case WEEKLY:
                periodStart = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                periodEnd = periodStart.plusDays(6);
                break;
            case YEARLY:
                periodStart = today.withDayOfYear(1);
                periodEnd = today.with(TemporalAdjusters.lastDayOfYear());
                break;
            case MONTHLY:
            default:
                periodStart = today.withDayOfMonth(1);
                periodEnd = today.with(TemporalAdjusters.lastDayOfMonth());
                break;
        }

        return new LocalDate[]{periodStart, periodEnd};
    }

    /**
     * Return a numeric ordering for severity levels so that CRITICAL sorts first,
     * WARNING second, and INFO last.
     */
    private int severityOrder(AiInsightResponse insight) {
        switch (insight.getSeverity()) {
            case "CRITICAL":
                return 0;
            case "WARNING":
                return 1;
            case "INFO":
                return 2;
            default:
                return 3;
        }
    }
}
