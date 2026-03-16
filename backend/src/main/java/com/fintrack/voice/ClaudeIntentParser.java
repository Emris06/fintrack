package com.fintrack.voice;

import com.fintrack.dto.response.AccountResponse;
import com.fintrack.dto.response.CategoryResponse;
import com.fintrack.dto.response.DebtResponse;
import com.fintrack.entity.enums.CategoryType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ClaudeIntentParser {

    // Amount patterns: "$50", "50 dollars", "50 usd", "50.99", "$1,200"
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "\\$([\\d,]+(?:\\.\\d{1,2})?)|([\\d,]+(?:\\.\\d{1,2})?)\\s*(?:dollars?|usd|eur|uzs|gbp|rub)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PLAIN_AMOUNT = Pattern.compile(
            "(?:of|for|about|around|exactly)?\\s*\\$?([\\d,]+(?:\\.\\d{1,2})?)");

    // Date patterns
    private static final Pattern DATE_FULL = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern DATE_MONTH_DAY = Pattern.compile(
            "(?:on\\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)\\s+(\\d{1,2})",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DATE_RELATIVE = Pattern.compile(
            "\\b(today|tomorrow|yesterday)\\b", Pattern.CASE_INSENSITIVE);

    // Transfer: "from X to Y"
    private static final Pattern TRANSFER_PATTERN = Pattern.compile(
            "from\\s+(.+?)\\s+to\\s+(.+?)(?:\\s|$)", Pattern.CASE_INSENSITIVE);

    // Person pattern for debts: "to/from/with [Name]", "[Name] owes", "I owe [Name]"
    private static final Pattern PERSON_OWE = Pattern.compile(
            "(?:i\\s+owe|owe)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PERSON_LENT = Pattern.compile(
            "(?:lent|loaned)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PERSON_OWES_ME = Pattern.compile(
            "([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+owes\\s+me", Pattern.CASE_INSENSITIVE);
    private static final Pattern PERSON_BORROWED = Pattern.compile(
            "([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+borrowed", Pattern.CASE_INSENSITIVE);
    private static final Pattern DEBT_WITH = Pattern.compile(
            "(?:debt|close|settle|paid)\\s+(?:with|to|from)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);

    public Map<String, Object> parseIntent(String userText,
                                            List<AccountResponse> accounts,
                                            List<CategoryResponse> categories,
                                            List<DebtResponse> debts) {
        String text = userText.trim();
        String lower = text.toLowerCase();
        log.info("Parsing intent from: {}", text);

        // 1. Check balance
        if (matchesAny(lower, "how much money", "my balance", "check balance", "show balance",
                "account balance", "what's my balance", "whats my balance", "how much do i have")) {
            return parseCheckBalance(lower, accounts);
        }

        // 2. Show statistics
        if (matchesAny(lower, "show statistics", "my statistics", "show stats", "my stats",
                "summary", "show summary", "monthly summary", "income and expense", "spending summary")) {
            return mapOf("intent", "show_statistics", "message", "Here's your financial summary.");
        }

        // 3. Budget status
        if (matchesAny(lower, "budget", "budget status", "show budget", "my budget", "how are my budgets")) {
            return mapOf("intent", "show_budget_status", "message", "Here's your budget status.");
        }

        // 4. Transfer
        if (matchesAny(lower, "transfer", "move money", "send money", "move from")) {
            return parseTransfer(text, lower, accounts);
        }

        // 5. Close debt
        if (matchesAny(lower, "close debt", "settle debt", "paid back", "paid off",
                "debt is closed", "debt is paid", "settled with", "close the debt")) {
            return parseCloseDebt(text, lower, debts);
        }

        // 6. Create debt (I owe someone)
        if (matchesAny(lower, "i owe", "i borrowed", "borrow from", "debt to")) {
            return parseCreateDebt(text, lower, accounts);
        }

        // 7. Create receivable (someone owes me)
        if (matchesAny(lower, "owes me", "lent", "loaned", "i lent", "i loaned", "borrowed from me")) {
            return parseCreateReceivable(text, lower, accounts);
        }

        // 8. Reminder
        if (matchesAny(lower, "remind", "reminder", "set reminder", "note for", "don't forget",
                "remember to", "schedule")) {
            return parseReminder(text, lower, accounts);
        }

        // 9. Add income
        if (matchesAny(lower, "received", "got paid", "income", "salary", "earned", "add income",
                "got income", "received payment")) {
            return parseAddIncome(text, lower, accounts, categories);
        }

        // 10. Add expense (broad — check last)
        if (matchesAny(lower, "spent", "paid", "bought", "expense", "add expense", "purchased",
                "cost me", "pay for", "payment for") || extractAmount(text) != null) {
            return parseAddExpense(text, lower, accounts, categories);
        }

        return mapOf("intent", "unknown", "message",
                "I didn't understand that. Try commands like:\n" +
                "• \"Add expense of $25 for coffee\"\n" +
                "• \"Transfer 100 from Card to Savings\"\n" +
                "• \"How much money do I have?\"\n" +
                "• \"Show my budget status\"\n" +
                "• \"I owe John 50 dollars\"\n" +
                "• \"Remind me on March 20 to pay rent\"");
    }

    // --- Intent parsers ---

    private Map<String, Object> parseCheckBalance(String lower, List<AccountResponse> accounts) {
        AccountResponse matched = fuzzyMatchAccount(lower, accounts);
        Map<String, Object> result = new HashMap<>();
        result.put("intent", "check_balance");
        result.put("accountId", matched != null ? matched.getId() : null);
        result.put("message", "Here are your account balances.");
        return result;
    }

    private Map<String, Object> parseTransfer(String text, String lower, List<AccountResponse> accounts) {
        BigDecimal amount = extractAmount(text);
        if (amount == null) {
            return mapOf("intent", "unknown", "message", "I need an amount for the transfer. Try: \"Transfer 100 from Card to Savings\"");
        }

        Matcher m = TRANSFER_PATTERN.matcher(text);
        if (!m.find()) {
            return mapOf("intent", "unknown", "message", "Please specify source and target: \"Transfer 100 from [account] to [account]\"");
        }

        String sourceName = m.group(1).trim();
        String targetName = m.group(2).replaceAll("(?i)\\s*\\$?[\\d,.]+.*", "").trim();

        AccountResponse source = fuzzyMatchAccount(sourceName.toLowerCase(), accounts);
        AccountResponse target = fuzzyMatchAccount(targetName.toLowerCase(), accounts);

        if (source == null || target == null) {
            return mapOf("intent", "unknown", "message",
                    "Couldn't find the accounts. Your accounts: " + accountNames(accounts));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "transfer");
        result.put("sourceAccountId", source.getId());
        result.put("targetAccountId", target.getId());
        result.put("amount", amount);
        result.put("description", "Voice transfer");
        result.put("transferDate", LocalDate.now().toString());
        result.put("message", String.format("I'll transfer %s %.2f from %s to %s. Shall I proceed?",
                source.getCurrency(), amount, source.getName(), target.getName()));
        return result;
    }

    private Map<String, Object> parseAddExpense(String text, String lower,
                                                 List<AccountResponse> accounts,
                                                 List<CategoryResponse> categories) {
        BigDecimal amount = extractAmount(text);
        if (amount == null) {
            return mapOf("intent", "unknown", "message", "I need an amount. Try: \"Add expense of $25 for coffee\"");
        }

        AccountResponse account = fuzzyMatchAccount(lower, accounts);
        if (account == null) account = getDefaultAccount(accounts);

        CategoryResponse category = fuzzyMatchCategory(lower, categories, CategoryType.EXPENSE);
        if (category == null) category = getFirstCategory(categories, CategoryType.EXPENSE);

        String description = extractDescription(lower, "expense");
        LocalDate date = extractDate(text);

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "add_expense");
        result.put("accountId", account.getId());
        result.put("categoryId", category.getId());
        result.put("amount", amount);
        result.put("currency", account.getCurrency());
        result.put("description", description);
        result.put("transactionDate", date.toString());
        result.put("message", String.format("I'll add an expense of %s %.2f for \"%s\" to %s (%s). Shall I proceed?",
                account.getCurrency(), amount, description, account.getName(), category.getName()));
        return result;
    }

    private Map<String, Object> parseAddIncome(String text, String lower,
                                                List<AccountResponse> accounts,
                                                List<CategoryResponse> categories) {
        BigDecimal amount = extractAmount(text);
        if (amount == null) {
            return mapOf("intent", "unknown", "message", "I need an amount. Try: \"Add income of $1000 salary\"");
        }

        AccountResponse account = fuzzyMatchAccount(lower, accounts);
        if (account == null) account = getDefaultAccount(accounts);

        CategoryResponse category = fuzzyMatchCategory(lower, categories, CategoryType.INCOME);
        if (category == null) category = getFirstCategory(categories, CategoryType.INCOME);

        String description = extractDescription(lower, "income");
        LocalDate date = extractDate(text);

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "add_income");
        result.put("accountId", account.getId());
        result.put("categoryId", category.getId());
        result.put("amount", amount);
        result.put("currency", account.getCurrency());
        result.put("description", description);
        result.put("transactionDate", date.toString());
        result.put("message", String.format("I'll add income of %s %.2f for \"%s\" to %s (%s). Shall I proceed?",
                account.getCurrency(), amount, description, account.getName(), category.getName()));
        return result;
    }

    private Map<String, Object> parseCreateDebt(String text, String lower, List<AccountResponse> accounts) {
        BigDecimal amount = extractAmount(text);
        if (amount == null) {
            return mapOf("intent", "unknown", "message", "I need an amount. Try: \"I owe John 50 dollars\"");
        }

        String person = extractPerson(text, PERSON_OWE);
        if (person == null) person = extractPerson(text, Pattern.compile(
                "(?:borrow(?:ed)?\\s+from|debt\\s+to)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE));
        if (person == null) {
            return mapOf("intent", "unknown", "message", "Who do you owe? Try: \"I owe John 50 dollars\"");
        }

        String currency = extractCurrency(lower, accounts);
        LocalDate dueDate = extractDate(text);

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "create_debt");
        result.put("personName", person);
        result.put("amount", amount);
        result.put("currency", currency);
        result.put("description", "Debt to " + person);
        if (!dueDate.equals(LocalDate.now())) {
            result.put("dueDate", dueDate.toString());
        }
        result.put("message", String.format("I'll record a debt: you owe %s %s %.2f. Shall I proceed?",
                person, currency, amount));
        return result;
    }

    private Map<String, Object> parseCreateReceivable(String text, String lower, List<AccountResponse> accounts) {
        BigDecimal amount = extractAmount(text);
        if (amount == null) {
            return mapOf("intent", "unknown", "message", "I need an amount. Try: \"John owes me 50 dollars\"");
        }

        String person = extractPerson(text, PERSON_OWES_ME);
        if (person == null) person = extractPerson(text, PERSON_BORROWED);
        if (person == null) person = extractPerson(text, PERSON_LENT);
        if (person == null) {
            return mapOf("intent", "unknown", "message", "Who owes you? Try: \"John owes me 50 dollars\" or \"I lent Sarah 30\"");
        }

        String currency = extractCurrency(lower, accounts);
        LocalDate dueDate = extractDate(text);

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "create_receivable");
        result.put("personName", person);
        result.put("amount", amount);
        result.put("currency", currency);
        result.put("description", "Receivable from " + person);
        if (!dueDate.equals(LocalDate.now())) {
            result.put("dueDate", dueDate.toString());
        }
        result.put("message", String.format("I'll record that %s owes you %s %.2f. Shall I proceed?",
                person, currency, amount));
        return result;
    }

    private Map<String, Object> parseCloseDebt(String text, String lower, List<DebtResponse> debts) {
        // Try to match by person name
        String person = extractPerson(text, DEBT_WITH);
        if (person == null) {
            // Try generic person extraction
            Matcher m = Pattern.compile("([A-Z][a-z]+)").matcher(text);
            while (m.find()) {
                String candidate = m.group(1).toLowerCase();
                for (DebtResponse d : debts) {
                    if (d.getPersonName().toLowerCase().contains(candidate)) {
                        person = d.getPersonName();
                        break;
                    }
                }
                if (person != null) break;
            }
        }

        if (person != null) {
            String personLower = person.toLowerCase();
            for (DebtResponse d : debts) {
                if (d.getPersonName().toLowerCase().contains(personLower)) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("intent", "close_debt");
                    result.put("debtId", d.getId());
                    result.put("message", String.format("I'll close the %s with %s (%.2f %s). Shall I proceed?",
                            d.getType().name().toLowerCase(), d.getPersonName(), d.getAmount(), d.getCurrency()));
                    return result;
                }
            }
        }

        if (debts.isEmpty()) {
            return mapOf("intent", "unknown", "message", "You don't have any open debts to close.");
        }

        StringBuilder sb = new StringBuilder("Which debt? Your open debts:\n");
        for (DebtResponse d : debts) {
            sb.append(String.format("• %s with %s: %.2f %s\n", d.getType(), d.getPersonName(), d.getAmount(), d.getCurrency()));
        }
        return mapOf("intent", "unknown", "message", sb.toString().trim());
    }

    private Map<String, Object> parseReminder(String text, String lower, List<AccountResponse> accounts) {
        LocalDate date = extractDate(text);
        if (date.equals(LocalDate.now())) {
            // Try harder to find a date for reminders
            date = LocalDate.now().plusDays(1); // default to tomorrow
        }

        BigDecimal amount = extractAmount(text);
        String currency = extractCurrency(lower, accounts);

        // Extract description: everything after "to" or "about" or the main content
        String description = extractReminderDescription(lower);

        Map<String, Object> result = new HashMap<>();
        result.put("intent", "create_reminder");
        result.put("description", description);
        result.put("reminderDate", date.toString());
        if (amount != null) {
            result.put("amount", amount);
            result.put("currency", currency);
        }
        result.put("message", String.format("I'll set a reminder for %s: \"%s\"%s. Shall I proceed?",
                date, description, amount != null ? String.format(" (%s %.2f)", currency, amount) : ""));
        return result;
    }

    // --- Extraction helpers ---

    private BigDecimal extractAmount(String text) {
        Matcher m = AMOUNT_PATTERN.matcher(text);
        if (m.find()) {
            String val = m.group(1) != null ? m.group(1) : m.group(2);
            return new BigDecimal(val.replace(",", ""));
        }
        // Fallback: look for standalone numbers near keywords
        Matcher plain = Pattern.compile("(?:of|for|about|spent|paid|transfer|owe|owes|lent|loaned|got|received|earned)\\s+\\$?([\\d,]+(?:\\.\\d{1,2})?)").matcher(text.toLowerCase());
        if (plain.find()) {
            return new BigDecimal(plain.group(1).replace(",", ""));
        }
        return null;
    }

    private LocalDate extractDate(String text) {
        // ISO date
        Matcher m = DATE_FULL.matcher(text);
        if (m.find()) {
            try { return LocalDate.parse(m.group(1)); } catch (DateTimeParseException ignored) {}
        }

        // Relative
        Matcher rel = DATE_RELATIVE.matcher(text);
        if (rel.find()) {
            switch (rel.group(1).toLowerCase()) {
                case "tomorrow": return LocalDate.now().plusDays(1);
                case "yesterday": return LocalDate.now().minusDays(1);
                default: return LocalDate.now();
            }
        }

        // "March 20", "April 5"
        Matcher monthDay = DATE_MONTH_DAY.matcher(text);
        if (monthDay.find()) {
            String monthStr = monthDay.group(0).replaceAll("\\d+", "").replaceAll("(?i)on\\s+", "").trim();
            int day = Integer.parseInt(monthDay.group(1));
            int month = monthNameToNumber(monthStr);
            if (month > 0) {
                int year = LocalDate.now().getYear();
                LocalDate date = LocalDate.of(year, month, Math.min(day, 28));
                if (date.isBefore(LocalDate.now())) {
                    date = date.plusYears(1);
                }
                return date;
            }
        }

        return LocalDate.now();
    }

    private String extractPerson(String text, Pattern pattern) {
        Matcher m = pattern.matcher(text);
        if (m.find()) return m.group(1).trim();
        return null;
    }

    private String extractCurrency(String lower, List<AccountResponse> accounts) {
        if (lower.contains("uzs") || lower.contains("som")) return "UZS";
        if (lower.contains("eur") || lower.contains("euro")) return "EUR";
        if (lower.contains("gbp") || lower.contains("pound")) return "GBP";
        if (lower.contains("rub") || lower.contains("ruble")) return "RUB";
        if (!accounts.isEmpty()) return accounts.get(0).getCurrency();
        return "USD";
    }

    private String extractDescription(String lower, String type) {
        // Try "for [description]"
        Matcher m = Pattern.compile("(?:for|on)\\s+(.+?)(?:\\s+(?:from|to|on|at|in)\\s|$)").matcher(lower);
        if (m.find()) {
            String desc = m.group(1).replaceAll("\\$?[\\d,.]+\\s*(?:dollars?|usd|eur)?", "").trim();
            if (!desc.isEmpty() && desc.length() > 2) return capitalize(desc);
        }

        // Try to get meaningful words after removing amount and keywords
        String cleaned = lower
                .replaceAll("\\$?[\\d,.]+\\s*(?:dollars?|usd|eur|uzs|gbp|rub)?", "")
                .replaceAll("\\b(?:add|spent|paid|bought|expense|income|received|got|earned|for|of|on|my|the|a|an|to|from|in|at)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (!cleaned.isEmpty() && cleaned.length() > 1) return capitalize(cleaned);

        return type.equals("expense") ? "Expense" : "Income";
    }

    private String extractReminderDescription(String lower) {
        // "remind me to [description]"
        Matcher m = Pattern.compile("(?:remind(?:er)?\\s+(?:me\\s+)?(?:to|about|for)\\s+)(.+?)(?:\\s+on\\s+|\\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)|$)")
                .matcher(lower);
        if (m.find()) return capitalize(m.group(1).replaceAll("\\$?[\\d,.]+\\s*(?:dollars?)?", "").trim());

        // "set reminder [description] for/on [date]"
        m = Pattern.compile("(?:reminder|remind)\\s+(?:for\\s+)?(.+?)(?:\\s+(?:on|for)\\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|tomorrow|\\d{4})|$)")
                .matcher(lower);
        if (m.find()) {
            String desc = m.group(1).replaceAll("\\$?[\\d,.]+\\s*(?:dollars?)?", "").replaceAll("\\bme\\b", "").trim();
            if (!desc.isEmpty()) return capitalize(desc);
        }

        // After date: "[date] [description]"
        m = Pattern.compile("(?:january|february|march|april|may|june|july|august|september|october|november|december)\\s+\\d{1,2}\\s+(.+)")
                .matcher(lower);
        if (m.find()) return capitalize(m.group(1).trim());

        return "Reminder";
    }

    // --- Fuzzy matching ---

    private AccountResponse fuzzyMatchAccount(String text, List<AccountResponse> accounts) {
        int bestScore = 0;
        AccountResponse best = null;
        for (AccountResponse a : accounts) {
            int score = fuzzyScore(text, a.getName().toLowerCase());
            if (score > bestScore) {
                bestScore = score;
                best = a;
            }
        }
        return bestScore >= 3 ? best : null;
    }

    private CategoryResponse fuzzyMatchCategory(String text, List<CategoryResponse> categories, CategoryType type) {
        int bestScore = 0;
        CategoryResponse best = null;

        // Common keyword → category mappings
        Map<String, String> keywordMap = new HashMap<>();
        keywordMap.put("coffee", "Dining");
        keywordMap.put("restaurant", "Dining");
        keywordMap.put("food", "Dining");
        keywordMap.put("lunch", "Dining");
        keywordMap.put("dinner", "Dining");
        keywordMap.put("breakfast", "Dining");
        keywordMap.put("eat", "Dining");
        keywordMap.put("grocery", "Groceries");
        keywordMap.put("groceries", "Groceries");
        keywordMap.put("supermarket", "Groceries");
        keywordMap.put("uber", "Transportation");
        keywordMap.put("taxi", "Transportation");
        keywordMap.put("gas", "Transportation");
        keywordMap.put("fuel", "Transportation");
        keywordMap.put("bus", "Transportation");
        keywordMap.put("metro", "Transportation");
        keywordMap.put("transport", "Transportation");
        keywordMap.put("movie", "Entertainment");
        keywordMap.put("netflix", "Subscriptions");
        keywordMap.put("spotify", "Subscriptions");
        keywordMap.put("subscription", "Subscriptions");
        keywordMap.put("subscribe", "Subscriptions");
        keywordMap.put("rent", "Housing");
        keywordMap.put("electric", "Utilities");
        keywordMap.put("water", "Utilities");
        keywordMap.put("internet", "Utilities");
        keywordMap.put("phone", "Utilities");
        keywordMap.put("clothes", "Shopping");
        keywordMap.put("shopping", "Shopping");
        keywordMap.put("bought", "Shopping");
        keywordMap.put("purchase", "Shopping");
        keywordMap.put("doctor", "Healthcare");
        keywordMap.put("medicine", "Healthcare");
        keywordMap.put("pharmacy", "Healthcare");
        keywordMap.put("hospital", "Healthcare");
        keywordMap.put("salary", "Salary");
        keywordMap.put("paycheck", "Salary");
        keywordMap.put("freelance", "Freelance");
        keywordMap.put("investment", "Investment");
        keywordMap.put("dividend", "Investment");

        // Try keyword mapping first
        for (Map.Entry<String, String> entry : keywordMap.entrySet()) {
            if (text.contains(entry.getKey())) {
                for (CategoryResponse c : categories) {
                    if (c.getType() == type && c.getName().equalsIgnoreCase(entry.getValue())) {
                        return c;
                    }
                }
            }
        }

        // Fuzzy match category names
        for (CategoryResponse c : categories) {
            if (c.getType() != type) continue;
            int score = fuzzyScore(text, c.getName().toLowerCase());
            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }
        return best;
    }

    private int fuzzyScore(String text, String target) {
        int score = 0;
        String[] words = target.split("\\s+");
        for (String word : words) {
            if (word.length() >= 3 && text.contains(word)) {
                score += word.length();
            }
        }
        // Bonus for exact word boundary match
        if (text.contains(target)) score += target.length() * 2;
        return score;
    }

    private AccountResponse getDefaultAccount(List<AccountResponse> accounts) {
        // Prefer CARD type, then first
        for (AccountResponse a : accounts) {
            if ("CARD".equalsIgnoreCase(a.getType().name())) return a;
        }
        return accounts.isEmpty() ? null : accounts.get(0);
    }

    private CategoryResponse getFirstCategory(List<CategoryResponse> categories, CategoryType type) {
        return categories.stream()
                .filter(c -> c.getType() == type)
                .findFirst()
                .orElse(categories.isEmpty() ? null : categories.get(0));
    }

    private String accountNames(List<AccountResponse> accounts) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < accounts.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(accounts.get(i).getName());
        }
        return sb.toString();
    }

    private int monthNameToNumber(String name) {
        String[] months = {"january", "february", "march", "april", "may", "june",
                "july", "august", "september", "october", "november", "december"};
        String lower = name.toLowerCase().trim();
        for (int i = 0; i < months.length; i++) {
            if (months[i].startsWith(lower) || lower.startsWith(months[i])) return i + 1;
        }
        return -1;
    }

    private boolean matchesAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    private Map<String, Object> mapOf(String... keyValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put(keyValues[i], keyValues[i + 1]);
        }
        return map;
    }
}
