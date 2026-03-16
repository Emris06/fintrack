package com.fintrack.voice;

import com.fintrack.dto.request.DebtRequest;
import com.fintrack.dto.request.ReminderRequest;
import com.fintrack.dto.request.TransactionRequest;
import com.fintrack.dto.request.TransferRequest;
import com.fintrack.dto.response.*;
import com.fintrack.entity.enums.DebtType;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class VoiceAssistantService {

    private final ClaudeIntentParser claudeIntentParser;
    private final PendingActionStore pendingActionStore;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final DebtService debtService;
    private final TransactionService transactionService;
    private final TransferService transferService;
    private final ReminderService reminderService;
    private final AnalyticsService analyticsService;
    private final BudgetService budgetService;

    public VoiceCommandResponse processCommand(Long userId, String text) {
        log.info("Processing voice command for user {}: {}", userId, text);

        List<AccountResponse> accounts = accountService.getAccounts(userId);
        List<CategoryResponse> categories = categoryService.getCategories(userId);
        List<DebtResponse> debts = debtService.getDebts(userId).stream()
                .filter(d -> "OPEN".equals(d.getStatus().name()))
                .collect(Collectors.toList());

        Map<String, Object> parsed = claudeIntentParser.parseIntent(text, accounts, categories, debts);
        String intent = (String) parsed.getOrDefault("intent", "unknown");
        String message = (String) parsed.getOrDefault("message", "I couldn't understand that.");

        log.info("Parsed intent: {} for user {}", intent, userId);

        switch (intent) {
            case "check_balance":
                return VoiceCommandResponse.builder()
                        .message("Taking you to your accounts.")
                        .intent("check_balance")
                        .navigateTo("/accounts")
                        .build();
            case "show_statistics":
                return VoiceCommandResponse.builder()
                        .message("Opening your analytics.")
                        .intent("show_statistics")
                        .navigateTo("/analytics")
                        .build();
            case "show_budget_status":
                return VoiceCommandResponse.builder()
                        .message("Opening your budgets.")
                        .intent("show_budget_status")
                        .navigateTo("/budgets")
                        .build();
            case "add_expense":
            case "add_income":
            case "transfer":
            case "create_debt":
            case "create_receivable":
            case "create_reminder":
            case "close_debt":
                return handleWriteIntent(userId, intent, parsed, message);
            default:
                return VoiceCommandResponse.builder()
                        .message(message)
                        .intent("unknown")
                        .requiresConfirmation(false)
                        .build();
        }
    }

    public VoiceCommandResponse confirmAction(Long userId, String pendingActionId, boolean confirmed) {
        Optional<PendingAction> opt = pendingActionStore.get(pendingActionId);
        if (opt.isEmpty()) {
            return VoiceCommandResponse.builder()
                    .message("This action has expired. Please try again.")
                    .intent("error")
                    .requiresConfirmation(false)
                    .build();
        }

        PendingAction action = opt.get();
        if (!action.getUserId().equals(userId)) {
            return VoiceCommandResponse.builder()
                    .message("Unauthorized action.")
                    .intent("error")
                    .requiresConfirmation(false)
                    .build();
        }

        pendingActionStore.remove(pendingActionId);

        if (!confirmed) {
            return VoiceCommandResponse.builder()
                    .message("Action cancelled.")
                    .intent(action.getIntent())
                    .requiresConfirmation(false)
                    .build();
        }

        try {
            return executeWriteAction(userId, action.getIntent(), action.getParsedData());
        } catch (Exception e) {
            log.error("Failed to execute action: {}", action.getIntent(), e);
            return VoiceCommandResponse.builder()
                    .message("Sorry, something went wrong: " + e.getMessage())
                    .intent("error")
                    .requiresConfirmation(false)
                    .build();
        }
    }

    private VoiceCommandResponse handleWriteIntent(Long userId, String intent,
                                                    Map<String, Object> parsed, String message) {
        PendingAction action = PendingAction.builder()
                .userId(userId)
                .intent(intent)
                .parsedData(parsed)
                .confirmationMessage(message)
                .build();

        String actionId = pendingActionStore.save(action);

        return VoiceCommandResponse.builder()
                .message(message)
                .intent(intent)
                .requiresConfirmation(true)
                .pendingActionId(actionId)
                .parsedData(parsed)
                .build();
    }

    private VoiceCommandResponse executeWriteAction(Long userId, String intent, Map<String, Object> data) {
        switch (intent) {
            case "add_expense":
                return executeAddTransaction(userId, data, TransactionType.EXPENSE);
            case "add_income":
                return executeAddTransaction(userId, data, TransactionType.INCOME);
            case "transfer":
                return executeTransfer(userId, data);
            case "create_debt":
                return executeCreateDebt(userId, data, DebtType.DEBT);
            case "create_receivable":
                return executeCreateDebt(userId, data, DebtType.RECEIVABLE);
            case "create_reminder":
                return executeCreateReminder(userId, data);
            case "close_debt":
                return executeCloseDebt(userId, data);
            default:
                return VoiceCommandResponse.builder()
                        .message("Unknown action type.")
                        .intent("error")
                        .build();
        }
    }

    private VoiceCommandResponse executeAddTransaction(Long userId, Map<String, Object> data, TransactionType type) {
        TransactionRequest req = TransactionRequest.builder()
                .accountId(toLong(data.get("accountId")))
                .categoryId(toLong(data.get("categoryId")))
                .type(type)
                .amount(toBigDecimal(data.get("amount")))
                .description((String) data.getOrDefault("description", ""))
                .transactionDate(toLocalDate((String) data.getOrDefault("transactionDate", LocalDate.now().toString())))
                .build();

        transactionService.createTransaction(userId, req);

        String typeLabel = type == TransactionType.EXPENSE ? "expense" : "income";
        String navigateTo = type == TransactionType.EXPENSE ? "/transactions" : "/transactions";
        return VoiceCommandResponse.builder()
                .message(String.format("Done! %s of %s %.2f has been recorded.",
                        capitalize(typeLabel), data.getOrDefault("currency", "USD"), toBigDecimal(data.get("amount"))))
                .intent("add_" + typeLabel)
                .requiresConfirmation(false)
                .navigateTo(navigateTo)
                .build();
    }

    private VoiceCommandResponse executeTransfer(Long userId, Map<String, Object> data) {
        TransferRequest req = TransferRequest.builder()
                .sourceAccountId(toLong(data.get("sourceAccountId")))
                .targetAccountId(toLong(data.get("targetAccountId")))
                .amount(toBigDecimal(data.get("amount")))
                .description((String) data.getOrDefault("description", "Voice transfer"))
                .idempotencyKey(UUID.randomUUID().toString())
                .transferDate(toLocalDate((String) data.getOrDefault("transferDate", LocalDate.now().toString())))
                .build();

        transferService.createTransfer(userId, req);

        return VoiceCommandResponse.builder()
                .message(String.format("Done! Transferred %.2f successfully.", toBigDecimal(data.get("amount"))))
                .intent("transfer")
                .requiresConfirmation(false)
                .navigateTo("/transfers")
                .build();
    }

    private VoiceCommandResponse executeCreateDebt(Long userId, Map<String, Object> data, DebtType type) {
        DebtRequest req = DebtRequest.builder()
                .type(type)
                .personName((String) data.get("personName"))
                .amount(toBigDecimal(data.get("amount")))
                .currency((String) data.getOrDefault("currency", "USD"))
                .description((String) data.getOrDefault("description", ""))
                .dueDate(data.get("dueDate") != null ? toLocalDate((String) data.get("dueDate")) : null)
                .build();

        debtService.createDebt(userId, req);

        String label = type == DebtType.DEBT ? "debt" : "receivable";
        return VoiceCommandResponse.builder()
                .message(String.format("Done! %s of %.2f %s with %s has been created.",
                        capitalize(label), req.getAmount(), req.getCurrency(), req.getPersonName()))
                .intent(type == DebtType.DEBT ? "create_debt" : "create_receivable")
                .requiresConfirmation(false)
                .navigateTo("/debts")
                .build();
    }

    private VoiceCommandResponse executeCreateReminder(Long userId, Map<String, Object> data) {
        ReminderRequest req = new ReminderRequest();
        req.setDescription((String) data.get("description"));
        req.setReminderDate(toLocalDate((String) data.get("reminderDate")));
        if (data.get("amount") != null) {
            req.setAmount(toBigDecimal(data.get("amount")));
        }
        if (data.get("currency") != null) {
            req.setCurrency((String) data.get("currency"));
        }

        reminderService.createReminder(userId, req);

        return VoiceCommandResponse.builder()
                .message(String.format("Done! Reminder \"%s\" set for %s.",
                        req.getDescription(), req.getReminderDate()))
                .intent("create_reminder")
                .requiresConfirmation(false)
                .navigateTo("/calendar")
                .build();
    }

    private VoiceCommandResponse executeCloseDebt(Long userId, Map<String, Object> data) {
        Long debtId = toLong(data.get("debtId"));
        debtService.closeDebt(userId, debtId);

        return VoiceCommandResponse.builder()
                .message("Done! The debt has been marked as closed.")
                .intent("close_debt")
                .requiresConfirmation(false)
                .navigateTo("/debts")
                .build();
    }

    private Long toLong(Object val) {
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        return new BigDecimal(val.toString());
    }

    private LocalDate toLocalDate(String val) {
        return LocalDate.parse(val);
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
