package com.fintrack.service;

import com.fintrack.dto.request.DebtRequest;
import com.fintrack.dto.response.DebtResponse;
import com.fintrack.entity.Debt;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.DebtStatus;
import com.fintrack.exception.InvalidOperationException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.DebtRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class DebtService {

    private final DebtRepository debtRepository;

    /**
     * Retrieve all non-deleted debts for a given user.
     *
     * @param userId the owner's user id
     * @return list of DebtResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<DebtResponse> getDebts(Long userId) {
        log.debug("Fetching all debts for user id: {}", userId);

        return debtRepository.findByUserIdAndIsDeletedFalse(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a single debt by id, ensuring it belongs to the specified user.
     *
     * @param userId the owner's user id
     * @param debtId the debt id
     * @return DebtResponse DTO
     */
    @Transactional(readOnly = true)
    public DebtResponse getDebt(Long userId, Long debtId) {
        log.debug("Fetching debt id: {} for user id: {}", debtId, userId);

        Debt debt = findDebtByIdAndUserId(debtId, userId);
        return mapToResponse(debt);
    }

    /**
     * Create a new debt record for the specified user with status OPEN.
     *
     * @param userId  the owner's user id
     * @param request the debt creation details
     * @return DebtResponse DTO of the newly created debt
     */
    public DebtResponse createDebt(Long userId, DebtRequest request) {
        log.info("Creating new debt for user id: {}, person: {}", userId, request.getPersonName());

        Debt debt = Debt.builder()
                .user(User.builder().id(userId).build())
                .type(request.getType())
                .personName(request.getPersonName())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(DebtStatus.OPEN)
                .build();

        debt = debtRepository.save(debt);

        log.info("Debt created with id: {} for user id: {}", debt.getId(), userId);

        return mapToResponse(debt);
    }

    /**
     * Update an existing debt. Only non-closed debts can be updated.
     *
     * @param userId  the owner's user id
     * @param debtId  the debt id to update
     * @param request the update details
     * @return DebtResponse DTO of the updated debt
     */
    public DebtResponse updateDebt(Long userId, Long debtId, DebtRequest request) {
        log.info("Updating debt id: {} for user id: {}", debtId, userId);

        Debt debt = findDebtByIdAndUserId(debtId, userId);

        if (debt.getStatus() == DebtStatus.CLOSED) {
            throw new InvalidOperationException("Cannot update a closed debt");
        }

        debt.setType(request.getType());
        debt.setPersonName(request.getPersonName());
        debt.setAmount(request.getAmount());
        debt.setCurrency(request.getCurrency());
        debt.setDescription(request.getDescription());
        debt.setDueDate(request.getDueDate());

        debt = debtRepository.save(debt);

        log.info("Debt id: {} updated successfully", debtId);

        return mapToResponse(debt);
    }

    /**
     * Close a debt by marking its status as CLOSED and recording the closure timestamp.
     *
     * @param userId the owner's user id
     * @param debtId the debt id to close
     * @return DebtResponse DTO of the closed debt
     */
    public DebtResponse closeDebt(Long userId, Long debtId) {
        log.info("Closing debt id: {} for user id: {}", debtId, userId);

        Debt debt = findDebtByIdAndUserId(debtId, userId);

        if (debt.getStatus() == DebtStatus.CLOSED) {
            throw new InvalidOperationException("Debt is already closed");
        }

        debt.setStatus(DebtStatus.CLOSED);
        debt.setClosedAt(LocalDateTime.now());

        debt = debtRepository.save(debt);

        log.info("Debt id: {} closed successfully", debtId);

        return mapToResponse(debt);
    }

    /**
     * Soft-delete a debt by marking it as deleted.
     *
     * @param userId the owner's user id
     * @param debtId the debt id to delete
     */
    public void deleteDebt(Long userId, Long debtId) {
        log.info("Soft-deleting debt id: {} for user id: {}", debtId, userId);

        Debt debt = findDebtByIdAndUserId(debtId, userId);

        debt.setIsDeleted(true);
        debtRepository.save(debt);

        log.info("Debt id: {} soft-deleted successfully", debtId);
    }

    /**
     * Retrieve all overdue debts for a user: OPEN debts whose due date has passed.
     *
     * @param userId the owner's user id
     * @return list of overdue DebtResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<DebtResponse> getOverdueDebts(Long userId) {
        log.debug("Fetching overdue debts for user id: {}", userId);

        return debtRepository.findOverdueDebtsByUserId(userId, LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private DebtResponse mapToResponse(Debt debt) {
        return DebtResponse.builder()
                .id(debt.getId())
                .type(debt.getType())
                .personName(debt.getPersonName())
                .amount(debt.getAmount())
                .currency(debt.getCurrency())
                .description(debt.getDescription())
                .dueDate(debt.getDueDate())
                .status(debt.getStatus())
                .closedAt(debt.getClosedAt())
                .createdAt(debt.getCreatedAt())
                .build();
    }

    private Debt findDebtByIdAndUserId(Long debtId, Long userId) {
        return debtRepository.findByIdAndUserIdAndIsDeletedFalse(debtId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Debt", "id", debtId));
    }
}
