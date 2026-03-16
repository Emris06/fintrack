package com.fintrack.service;

import com.fintrack.dto.response.AnalyticsSummaryResponse;
import com.fintrack.dto.response.CategoryBreakdownResponse;
import com.fintrack.dto.response.CategoryComparisonResponse;
import com.fintrack.dto.response.TrendDataResponse;
import com.fintrack.entity.Category;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Service for computing financial analytics including summaries,
 * category breakdowns, trends, calendar data, and savings rate.
 */
@Service
@Transactional(readOnly = true)
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final int MONEY_SCALE = 4;
    private static final int PERCENT_SCALE = 2;

    /**
     * Get a financial summary for the given date range.
     * Defaults to the current month if dates are not provided.
     *
     * @param userId   the owner's user id
     * @param dateFrom start date (inclusive), defaults to first day of current month
     * @param dateTo   end date (inclusive), defaults to today
     * @return AnalyticsSummaryResponse with totals and net result
     */
    public AnalyticsSummaryResponse getSummary(Long userId, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate from = resolveFrom(dateFrom);
        LocalDate to = resolveTo(dateTo);

        log.debug("Calculating summary for user id: {}, period: {} to {}", userId, from, to);

        BigDecimal totalIncome = nullSafe(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.INCOME, from, to));

        BigDecimal totalExpenses = nullSafe(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.EXPENSE, from, to));

        BigDecimal netResult = totalIncome.subtract(totalExpenses);

        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netResult
                    .multiply(ONE_HUNDRED)
                    .divide(totalIncome, PERCENT_SCALE, RoundingMode.HALF_UP);
        }

        String period = from.toString() + " to " + to.toString();

        log.info("Summary for user id: {} - income: {}, expenses: {}, net: {}, savings rate: {}%",
                userId, totalIncome, totalExpenses, netResult, savingsRate);

        return AnalyticsSummaryResponse.builder()
                .totalIncome(totalIncome.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .totalExpenses(totalExpenses.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .netResult(netResult.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .savingsRate(savingsRate)
                .period(period)
                .build();
    }

    /**
     * Get spending breakdown by category for the given date range.
     * Each entry includes the category details, total amount, percentage of total expenses,
     * and the number of transactions.
     *
     * @param userId   the owner's user id
     * @param dateFrom start date (inclusive)
     * @param dateTo   end date (inclusive)
     * @return list of CategoryBreakdownResponse sorted by amount descending
     */
    public List<CategoryBreakdownResponse> getCategoryBreakdown(Long userId, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate from = resolveFrom(dateFrom);
        LocalDate to = resolveTo(dateTo);

        log.debug("Calculating category breakdown for user id: {}, period: {} to {}", userId, from, to);

        List<Object[]> categoryData = transactionRepository.sumAmountGroupedByCategoryForExpense(
                userId, from, to);

        // Calculate the total expenses across all categories
        BigDecimal totalExpenses = BigDecimal.ZERO;
        for (Object[] row : categoryData) {
            BigDecimal amount = (BigDecimal) row[1];
            totalExpenses = totalExpenses.add(amount);
        }

        // Count transactions per category
        Map<Long, Integer> transactionCounts = countTransactionsPerCategory(userId, from, to);

        List<CategoryBreakdownResponse> breakdowns = new ArrayList<>();

        for (Object[] row : categoryData) {
            Category category = (Category) row[0];
            BigDecimal amount = (BigDecimal) row[1];

            BigDecimal percentage = BigDecimal.ZERO;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount
                        .multiply(ONE_HUNDRED)
                        .divide(totalExpenses, PERCENT_SCALE, RoundingMode.HALF_UP);
            }

            int txCount = transactionCounts.getOrDefault(category.getId(), 0);

            breakdowns.add(CategoryBreakdownResponse.builder()
                    .categoryId(category.getId())
                    .categoryName(category.getName())
                    .categoryColor(category.getColor())
                    .categoryIcon(category.getIcon())
                    .amount(amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                    .percentage(percentage)
                    .transactionCount(txCount)
                    .build());
        }

        log.info("Category breakdown for user id: {} returned {} categories", userId, breakdowns.size());
        return breakdowns;
    }

    /**
     * Get income/expense trend data for the given date range and granularity.
     * Supports DAILY, WEEKLY, MONTHLY, and YEARLY granularity.
     * Periods with no data are filled in with zero values.
     */
    public TrendDataResponse getTrend(Long userId, LocalDate dateFrom, LocalDate dateTo, String granularity) {
        LocalDate from = resolveFrom(dateFrom);
        LocalDate to = resolveTo(dateTo);
        String gran = (granularity != null) ? granularity.toUpperCase() : "MONTHLY";

        log.debug("Calculating {} trends for user id: {}, period: {} to {}", gran, userId, from, to);

        switch (gran) {
            case "DAILY":
                return buildDailyTrend(userId, from, to);
            case "WEEKLY":
                return buildWeeklyTrend(userId, from, to);
            case "YEARLY":
                return buildYearlyTrend(userId, from, to);
            case "MONTHLY":
            default:
                return buildMonthlyTrend(userId, from, to);
        }
    }

    private TrendDataResponse buildDailyTrend(Long userId, LocalDate from, LocalDate to) {
        List<Object[]> dailyData = transactionRepository.findDailyTotals(userId, from, to);

        Map<String, BigDecimal[]> dayMap = new LinkedHashMap<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            dayMap.put(current.toString(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            current = current.plusDays(1);
        }

        for (Object[] row : dailyData) {
            LocalDate date = (LocalDate) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal total = (BigDecimal) row[2];
            BigDecimal[] values = dayMap.get(date.toString());
            if (values != null) {
                if (type == TransactionType.INCOME) values[0] = total;
                else if (type == TransactionType.EXPENSE) values[1] = total;
            }
        }

        return buildTrendResponse(dayMap);
    }

    private TrendDataResponse buildWeeklyTrend(Long userId, LocalDate from, LocalDate to) {
        List<Object[]> weeklyData = transactionRepository.findWeeklyTotals(userId, from, to);

        Map<String, BigDecimal[]> weekMap = new LinkedHashMap<>();
        LocalDate current = from.with(DayOfWeek.MONDAY);
        if (current.isAfter(from)) current = current.minusWeeks(1);
        while (!current.isAfter(to)) {
            String key = current.toString();
            weekMap.put(key, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            current = current.plusWeeks(1);
        }

        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        for (Object[] row : weeklyData) {
            int year = (Integer) row[0];
            int week = (Integer) row[1];
            TransactionType type = (TransactionType) row[2];
            BigDecimal total = (BigDecimal) row[3];

            LocalDate weekStart = LocalDate.of(year, 1, 1)
                    .with(weekFields.weekOfYear(), week)
                    .with(DayOfWeek.MONDAY);
            String key = weekStart.toString();
            BigDecimal[] values = weekMap.get(key);
            if (values != null) {
                if (type == TransactionType.INCOME) values[0] = total;
                else if (type == TransactionType.EXPENSE) values[1] = total;
            }
        }

        return buildTrendResponse(weekMap);
    }

    private TrendDataResponse buildMonthlyTrend(Long userId, LocalDate from, LocalDate to) {
        List<Object[]> monthlyData = transactionRepository.findMonthlyTotals(userId, from, to);

        Map<String, BigDecimal[]> monthMap = new LinkedHashMap<>();
        YearMonth startYm = YearMonth.from(from);
        YearMonth endYm = YearMonth.from(to);
        YearMonth current = startYm;
        while (!current.isAfter(endYm)) {
            monthMap.put(current.toString(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            current = current.plusMonths(1);
        }

        for (Object[] row : monthlyData) {
            int year = (Integer) row[0];
            int month = (Integer) row[1];
            TransactionType type = (TransactionType) row[2];
            BigDecimal total = (BigDecimal) row[3];
            String key = YearMonth.of(year, month).toString();
            BigDecimal[] values = monthMap.get(key);
            if (values != null) {
                if (type == TransactionType.INCOME) values[0] = total;
                else if (type == TransactionType.EXPENSE) values[1] = total;
            }
        }

        return buildTrendResponse(monthMap);
    }

    private TrendDataResponse buildYearlyTrend(Long userId, LocalDate from, LocalDate to) {
        List<Object[]> yearlyData = transactionRepository.findYearlyTotals(userId, from, to);

        Map<String, BigDecimal[]> yearMap = new LinkedHashMap<>();
        for (int year = from.getYear(); year <= to.getYear(); year++) {
            yearMap.put(String.valueOf(year), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }

        for (Object[] row : yearlyData) {
            int year = (Integer) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal total = (BigDecimal) row[2];
            BigDecimal[] values = yearMap.get(String.valueOf(year));
            if (values != null) {
                if (type == TransactionType.INCOME) values[0] = total;
                else if (type == TransactionType.EXPENSE) values[1] = total;
            }
        }

        return buildTrendResponse(yearMap);
    }

    private TrendDataResponse buildTrendResponse(Map<String, BigDecimal[]> dataMap) {
        List<TrendDataResponse.TrendPoint> points = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : dataMap.entrySet()) {
            points.add(TrendDataResponse.TrendPoint.builder()
                    .date(entry.getKey())
                    .income(entry.getValue()[0].setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                    .expense(entry.getValue()[1].setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                    .build());
        }
        return TrendDataResponse.builder().points(points).build();
    }

    /**
     * Get income vs expense comparison grouped by category.
     */
    public List<CategoryComparisonResponse> getCategoryComparison(Long userId, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate from = resolveFrom(dateFrom);
        LocalDate to = resolveTo(dateTo);

        log.debug("Calculating category comparison for user id: {}, period: {} to {}", userId, from, to);

        List<Object[]> data = transactionRepository.sumAmountGroupedByCategoryAndType(userId, from, to);

        // Group by category id
        Map<Long, CategoryComparisonResponse> categoryMap = new LinkedHashMap<>();

        for (Object[] row : data) {
            Category category = (Category) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            CategoryComparisonResponse entry = categoryMap.computeIfAbsent(category.getId(), id ->
                    CategoryComparisonResponse.builder()
                            .categoryId(category.getId())
                            .categoryName(category.getName())
                            .categoryColor(category.getColor())
                            .categoryIcon(category.getIcon())
                            .income(BigDecimal.ZERO)
                            .expense(BigDecimal.ZERO)
                            .build());

            if (type == TransactionType.INCOME) {
                entry.setIncome(amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
            } else if (type == TransactionType.EXPENSE) {
                entry.setExpense(amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
            }
        }

        log.info("Category comparison for user id: {} returned {} categories", userId, categoryMap.size());
        return new ArrayList<>(categoryMap.values());
    }

    /**
     * Get calendar heatmap data for a given year and month.
     * Defaults to the current year/month if not provided.
     *
     * @param userId the owner's user id
     * @param year   the year (optional, defaults to current)
     * @param month  the month (optional, defaults to current)
     * @return map containing year, month, and a list of daily totals
     */
    public Map<String, Object> getCalendarData(Long userId, Integer year, Integer month) {
        LocalDate today = LocalDate.now();
        int resolvedYear = (year != null) ? year : today.getYear();
        int resolvedMonth = (month != null) ? month : today.getMonthValue();

        log.debug("Calculating calendar data for user id: {}, year: {}, month: {}",
                userId, resolvedYear, resolvedMonth);

        YearMonth ym = YearMonth.of(resolvedYear, resolvedMonth);
        LocalDate dateFrom = ym.atDay(1);
        LocalDate dateTo = ym.atEndOfMonth();

        List<Object[]> dailyData = transactionRepository.findDailyTotals(userId, dateFrom, dateTo);

        // Build a map keyed by day-of-month for income and expense
        // Index 0 = income, Index 1 = expense
        Map<Integer, BigDecimal[]> dayMap = new LinkedHashMap<>();
        int daysInMonth = ym.lengthOfMonth();
        for (int day = 1; day <= daysInMonth; day++) {
            dayMap.put(day, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }

        // Each row: [transactionDate (LocalDate), type (TransactionType), total (BigDecimal)]
        for (Object[] row : dailyData) {
            LocalDate date = (LocalDate) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal total = (BigDecimal) row[2];

            BigDecimal[] values = dayMap.get(date.getDayOfMonth());
            if (values != null) {
                if (type == TransactionType.INCOME) {
                    values[0] = total;
                } else if (type == TransactionType.EXPENSE) {
                    values[1] = total;
                }
            }
        }

        // Build the days list
        List<Map<String, Object>> days = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal[]> entry : dayMap.entrySet()) {
            Map<String, Object> dayEntry = new HashMap<>();
            LocalDate date = ym.atDay(entry.getKey());
            BigDecimal income = entry.getValue()[0].setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            BigDecimal expense = entry.getValue()[1].setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            BigDecimal net = income.subtract(expense).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            dayEntry.put("date", date.toString());
            dayEntry.put("income", income);
            dayEntry.put("expense", expense);
            dayEntry.put("net", net);

            days.add(dayEntry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year", resolvedYear);
        result.put("month", resolvedMonth);
        result.put("days", days);

        log.info("Calendar data for user id: {} ({}-{}) returned {} days",
                userId, resolvedYear, resolvedMonth, days.size());
        return result;
    }

    /**
     * Calculate the savings rate for the given date range.
     * Returns an AnalyticsSummaryResponse populated with income, expenses, net result,
     * savings rate, and the period string.
     *
     * @param userId   the owner's user id
     * @param dateFrom start date (inclusive)
     * @param dateTo   end date (inclusive)
     * @return AnalyticsSummaryResponse with savings rate
     */
    public AnalyticsSummaryResponse getSavingsRate(Long userId, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate from = resolveFrom(dateFrom);
        LocalDate to = resolveTo(dateTo);

        log.debug("Calculating savings rate for user id: {}, period: {} to {}", userId, from, to);

        BigDecimal totalIncome = nullSafe(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.INCOME, from, to));

        BigDecimal totalExpenses = nullSafe(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.EXPENSE, from, to));

        BigDecimal netResult = totalIncome.subtract(totalExpenses);

        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netResult
                    .multiply(ONE_HUNDRED)
                    .divide(totalIncome, PERCENT_SCALE, RoundingMode.HALF_UP);
        }

        String period = from.toString() + " to " + to.toString();

        log.info("Savings rate for user id: {} = {}%", userId, savingsRate);

        return AnalyticsSummaryResponse.builder()
                .totalIncome(totalIncome.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .totalExpenses(totalExpenses.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .netResult(netResult.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .savingsRate(savingsRate)
                .period(period)
                .build();
    }

    // -----------------------------------------------------------------------
    // Private helper methods
    // -----------------------------------------------------------------------

    /**
     * Resolve the start date, defaulting to the first day of the current month if null.
     */
    private LocalDate resolveFrom(LocalDate dateFrom) {
        return (dateFrom != null) ? dateFrom : LocalDate.now().withDayOfMonth(1);
    }

    /**
     * Resolve the end date, defaulting to today if null.
     */
    private LocalDate resolveTo(LocalDate dateTo) {
        return (dateTo != null) ? dateTo : LocalDate.now();
    }

    /**
     * Return the given value or BigDecimal.ZERO if null.
     */
    private BigDecimal nullSafe(BigDecimal value) {
        return (value != null) ? value : BigDecimal.ZERO;
    }

    /**
     * Count the number of expense transactions per category for a user within the given period.
     * Fetches all expense transactions and groups the count by category in memory.
     */
    private Map<Long, Integer> countTransactionsPerCategory(Long userId, LocalDate dateFrom, LocalDate dateTo) {
        var page = transactionRepository.findWithFilters(
                userId,
                TransactionType.EXPENSE,
                null,
                null,
                dateFrom,
                dateTo,
                PageRequest.of(0, Integer.MAX_VALUE));

        Map<Long, Integer> counts = new HashMap<>();
        for (var tx : page.getContent()) {
            if (tx.getCategory() != null) {
                counts.merge(tx.getCategory().getId(), 1, Integer::sum);
            }
        }

        return counts;
    }
}
