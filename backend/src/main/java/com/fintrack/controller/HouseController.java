package com.fintrack.controller;

import com.fintrack.dto.request.BillRequest;
import com.fintrack.dto.request.HouseRequest;
import com.fintrack.dto.request.HouseServiceRequest;
import com.fintrack.dto.request.PayBillRequest;
import com.fintrack.dto.response.*;
import com.fintrack.service.HouseModuleService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/houses")
@RequiredArgsConstructor
public class HouseController {

    private final HouseModuleService houseModuleService;

    // ─── Houses ──────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<HouseResponse>>> getHouses() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.getHouses(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseResponse>> getHouse(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.getHouse(userId, id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HouseResponse>> createHouse(@Valid @RequestBody HouseRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        HouseResponse result = houseModuleService.createHouse(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("House created", result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseResponse>> updateHouse(@PathVariable Long id, @Valid @RequestBody HouseRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.updateHouse(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHouse(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        houseModuleService.deleteHouse(userId, id);
        return ResponseEntity.noContent().build();
    }

    // ─── Services ────────────────────────────────────────────

    @GetMapping("/{houseId}/services")
    public ResponseEntity<ApiResponse<List<HouseServiceResponse>>> getServices(@PathVariable Long houseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.getServices(userId, houseId)));
    }

    @PostMapping("/{houseId}/services")
    public ResponseEntity<ApiResponse<HouseServiceResponse>> createService(
            @PathVariable Long houseId, @Valid @RequestBody HouseServiceRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        HouseServiceResponse result = houseModuleService.createService(userId, houseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Service added", result));
    }

    @PutMapping("/{houseId}/services/{serviceId}")
    public ResponseEntity<ApiResponse<HouseServiceResponse>> updateService(
            @PathVariable Long houseId, @PathVariable Long serviceId, @Valid @RequestBody HouseServiceRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.updateService(userId, houseId, serviceId, request)));
    }

    @DeleteMapping("/{houseId}/services/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable Long houseId, @PathVariable Long serviceId) {
        Long userId = SecurityUtils.getCurrentUserId();
        houseModuleService.deleteService(userId, houseId, serviceId);
        return ResponseEntity.noContent().build();
    }

    // ─── Bills ───────────────────────────────────────────────

    @GetMapping("/{houseId}/services/{serviceId}/bills")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getBills(
            @PathVariable Long houseId, @PathVariable Long serviceId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.getBills(userId, houseId, serviceId)));
    }

    @PostMapping("/{houseId}/services/{serviceId}/bills")
    public ResponseEntity<ApiResponse<BillResponse>> createBill(
            @PathVariable Long houseId, @PathVariable Long serviceId, @Valid @RequestBody BillRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        BillResponse result = houseModuleService.createBill(userId, houseId, serviceId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Bill created", result));
    }

    @PutMapping("/bills/{billId}")
    public ResponseEntity<ApiResponse<BillResponse>> updateBill(
            @PathVariable Long billId, @Valid @RequestBody BillRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(houseModuleService.updateBill(userId, billId, request)));
    }

    @DeleteMapping("/bills/{billId}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long billId) {
        Long userId = SecurityUtils.getCurrentUserId();
        houseModuleService.deleteBill(userId, billId);
        return ResponseEntity.noContent().build();
    }

    // ─── Pay Bill ────────────────────────────────────────────

    @PostMapping("/bills/{billId}/pay")
    public ResponseEntity<ApiResponse<BillPaymentResponse>> payBill(
            @PathVariable Long billId, @Valid @RequestBody PayBillRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        BillPaymentResponse result = houseModuleService.payBill(userId, billId, request);
        return ResponseEntity.ok(ApiResponse.success("Bill paid successfully", result));
    }
}
