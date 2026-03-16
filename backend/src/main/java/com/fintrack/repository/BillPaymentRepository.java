package com.fintrack.repository;

import com.fintrack.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {

    List<BillPayment> findByBillIdOrderByPaymentDateDesc(Long billId);
}
