package com.fintrack.controller;

import com.fintrack.dto.request.CarRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.CarResponse;
import com.fintrack.dto.response.FineResponse;
import com.fintrack.service.CarService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CarResponse>>> getCars() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CarResponse> result = carService.getCars(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CarResponse>> createCar(@Valid @RequestBody CarRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        CarResponse result = carService.createCar(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Car created successfully", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        carService.deleteCar(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{carId}/fines")
    public ResponseEntity<ApiResponse<List<FineResponse>>> getCarFines(@PathVariable Long carId) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<FineResponse> result = carService.getCarFines(userId, carId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{carId}/fines/{fineId}/pay")
    public ResponseEntity<ApiResponse<FineResponse>> payFine(@PathVariable Long carId, @PathVariable Long fineId) {
        Long userId = SecurityUtils.getCurrentUserId();
        FineResponse result = carService.payFine(userId, carId, fineId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
