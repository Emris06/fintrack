package com.fintrack.service;

import com.fintrack.dto.request.BillRequest;
import com.fintrack.dto.request.HouseRequest;
import com.fintrack.dto.request.HouseServiceRequest;
import com.fintrack.dto.request.PayBillRequest;
import com.fintrack.dto.response.BillPaymentResponse;
import com.fintrack.dto.response.BillResponse;
import com.fintrack.dto.response.HouseResponse;
import com.fintrack.dto.response.HouseServiceResponse;
import com.fintrack.entity.*;
import com.fintrack.entity.enums.BillStatus;
import com.fintrack.entity.enums.BillingCycle;
import com.fintrack.entity.enums.TransactionType;
import com.fintrack.exception.InvalidOperationException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HouseModuleService {

    private final HouseRepository houseRepository;
    private final HouseServiceRepository houseServiceRepository;
    private final BillRepository billRepository;
    private final BillPaymentRepository billPaymentRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;

    private static final Long BILLS_CATEGORY_ID = 10L; // "Bills & Utilities"

    // ─── Houses ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<HouseResponse> getHouses(Long userId) {
        return houseRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapHouseResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HouseResponse getHouse(Long userId, Long houseId) {
        House house = findHouseByUser(houseId, userId);
        return mapHouseResponse(house);
    }

    public HouseResponse createHouse(Long userId, HouseRequest request) {
        House house = House.builder()
                .user(User.builder().id(userId).build())
                .houseName(request.getHouseName())
                .address(request.getAddress())
                .build();
        house = houseRepository.save(house);
        log.info("Created house id={} for userId={}", house.getId(), userId);
        return mapHouseResponse(house);
    }

    public HouseResponse updateHouse(Long userId, Long houseId, HouseRequest request) {
        House house = findHouseByUser(houseId, userId);
        house.setHouseName(request.getHouseName());
        house.setAddress(request.getAddress());
        house = houseRepository.save(house);
        log.info("Updated house id={} for userId={}", houseId, userId);
        return mapHouseResponse(house);
    }

    public void deleteHouse(Long userId, Long houseId) {
        House house = findHouseByUser(houseId, userId);
        houseRepository.delete(house);
        log.info("Deleted house id={} for userId={}", houseId, userId);
    }

    // ─── Services ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<HouseServiceResponse> getServices(Long userId, Long houseId) {
        findHouseByUser(houseId, userId);
        return houseServiceRepository.findByHouseIdOrderByCreatedAtDesc(houseId)
                .stream()
                .map(this::mapServiceResponse)
                .toList();
    }

    public HouseServiceResponse createService(Long userId, Long houseId, HouseServiceRequest request) {
        findHouseByUser(houseId, userId);
        HouseService service = HouseService.builder()
                .house(House.builder().id(houseId).build())
                .serviceName(request.getServiceName())
                .providerName(request.getProviderName())
                .accountNumber(request.getAccountNumber())
                .billingCycle(request.getBillingCycle() != null ? request.getBillingCycle() : BillingCycle.MONTHLY)
                .averageAmount(request.getAverageAmount())
                .build();
        service = houseServiceRepository.save(service);
        log.info("Created service id={} for houseId={}", service.getId(), houseId);
        return mapServiceResponse(service);
    }

    public HouseServiceResponse updateService(Long userId, Long houseId, Long serviceId, HouseServiceRequest request) {
        findHouseByUser(houseId, userId);
        HouseService service = houseServiceRepository.findByIdAndHouseId(serviceId, houseId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        service.setServiceName(request.getServiceName());
        service.setProviderName(request.getProviderName());
        service.setAccountNumber(request.getAccountNumber());
        if (request.getBillingCycle() != null) {
            service.setBillingCycle(request.getBillingCycle());
        }
        service.setAverageAmount(request.getAverageAmount());
        service = houseServiceRepository.save(service);
        log.info("Updated service id={}", serviceId);
        return mapServiceResponse(service);
    }

    public void deleteService(Long userId, Long houseId, Long serviceId) {
        findHouseByUser(houseId, userId);
        HouseService service = houseServiceRepository.findByIdAndHouseId(serviceId, houseId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        houseServiceRepository.delete(service);
        log.info("Deleted service id={}", serviceId);
    }

    // ─── Bills ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BillResponse> getBills(Long userId, Long houseId, Long serviceId) {
        findHouseByUser(houseId, userId);
        houseServiceRepository.findByIdAndHouseId(serviceId, houseId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        return billRepository.findByServiceIdOrderByDueDateDesc(serviceId)
                .stream()
                .map(this::mapBillResponse)
                .toList();
    }

    public BillResponse createBill(Long userId, Long houseId, Long serviceId, BillRequest request) {
        findHouseByUser(houseId, userId);
        houseServiceRepository.findByIdAndHouseId(serviceId, houseId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        Bill bill = Bill.builder()
                .service(HouseService.builder().id(serviceId).build())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .description(request.getDescription())
                .build();
        bill = billRepository.save(bill);
        log.info("Created bill id={} for serviceId={}", bill.getId(), serviceId);
        return mapBillResponse(bill);
    }

    public BillResponse updateBill(Long userId, Long billId, BillRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));
        verifyBillOwnership(bill, userId);
        bill.setAmount(request.getAmount());
        bill.setDueDate(request.getDueDate());
        bill.setDescription(request.getDescription());
        bill = billRepository.save(bill);
        log.info("Updated bill id={}", billId);
        return mapBillResponse(bill);
    }

    public void deleteBill(Long userId, Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));
        verifyBillOwnership(bill, userId);
        billRepository.delete(bill);
        log.info("Deleted bill id={}", billId);
    }

    // ─── Pay Bill (integrates with transactions) ─────────────

    public BillPaymentResponse payBill(Long userId, Long billId, PayBillRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));
        verifyBillOwnership(bill, userId);

        if (bill.getStatus() == BillStatus.PAID) {
            throw new InvalidOperationException("Bill is already paid");
        }

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));

        Category category = categoryRepository.findById(BILLS_CATEGORY_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", BILLS_CATEGORY_ID));

        // Debit the account
        account.debit(bill.getAmount());

        // Create a transaction record
        Transaction transaction = Transaction.builder()
                .user(User.builder().id(userId).build())
                .account(account)
                .category(category)
                .type(TransactionType.EXPENSE)
                .amount(bill.getAmount())
                .description(bill.getDescription() != null ? bill.getDescription() : "House bill payment")
                .note("Paid via My House - " + bill.getService().getServiceName())
                .transactionDate(LocalDate.now())
                .build();
        transaction = transactionRepository.save(transaction);
        accountRepository.save(account);

        // Mark bill as paid
        bill.setStatus(BillStatus.PAID);
        billRepository.save(bill);

        // Record the payment
        BillPayment payment = BillPayment.builder()
                .bill(bill)
                .account(account)
                .transaction(transaction)
                .amount(bill.getAmount())
                .paymentDate(LocalDateTime.now())
                .build();
        payment = billPaymentRepository.save(payment);

        log.info("Paid bill id={} via accountId={}, transactionId={}", billId, account.getId(), transaction.getId());

        return BillPaymentResponse.builder()
                .id(payment.getId())
                .billId(bill.getId())
                .accountId(account.getId())
                .accountName(account.getName())
                .transactionId(transaction.getId())
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────

    private House findHouseByUser(Long houseId, Long userId) {
        return houseRepository.findByIdAndUserId(houseId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("House", "id", houseId));
    }

    private void verifyBillOwnership(Bill bill, Long userId) {
        Long houseId = bill.getService().getHouse().getId();
        findHouseByUser(houseId, userId);
    }

    private HouseResponse mapHouseResponse(House house) {
        BigDecimal totalDue = billRepository.sumPendingByHouseId(house.getId());
        int pendingCount = billRepository.countPendingByHouseId(house.getId());
        int servicesCount = houseServiceRepository.findByHouseIdOrderByCreatedAtDesc(house.getId()).size();

        return HouseResponse.builder()
                .id(house.getId())
                .houseName(house.getHouseName())
                .address(house.getAddress())
                .totalDue(totalDue)
                .pendingBillsCount(pendingCount)
                .servicesCount(servicesCount)
                .createdAt(house.getCreatedAt())
                .build();
    }

    private HouseServiceResponse mapServiceResponse(HouseService service) {
        BigDecimal pending = billRepository.sumPendingByServiceId(service.getId());
        int pendingCount = billRepository.countPendingByServiceId(service.getId());

        return HouseServiceResponse.builder()
                .id(service.getId())
                .houseId(service.getHouse().getId())
                .serviceName(service.getServiceName())
                .providerName(service.getProviderName())
                .accountNumber(service.getAccountNumber())
                .billingCycle(service.getBillingCycle().name())
                .averageAmount(service.getAverageAmount())
                .pendingAmount(pending)
                .pendingBillsCount(pendingCount)
                .createdAt(service.getCreatedAt())
                .build();
    }

    private BillResponse mapBillResponse(Bill bill) {
        return BillResponse.builder()
                .id(bill.getId())
                .serviceId(bill.getService().getId())
                .serviceName(bill.getService().getServiceName())
                .amount(bill.getAmount())
                .dueDate(bill.getDueDate())
                .status(bill.getStatus().name())
                .description(bill.getDescription())
                .createdAt(bill.getCreatedAt())
                .build();
    }
}
