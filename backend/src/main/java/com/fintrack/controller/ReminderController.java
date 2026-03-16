package com.fintrack.controller;

import com.fintrack.dto.request.ReminderRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.ReminderResponse;
import com.fintrack.service.ReminderService;
import com.fintrack.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReminderResponse>>> getRemindersByMonth(
            @RequestParam int year,
            @RequestParam int month) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<ReminderResponse> result = reminderService.getRemindersByMonth(userId, year, month);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/by-date")
    public ResponseEntity<ApiResponse<List<ReminderResponse>>> getRemindersByDate(
            @RequestParam LocalDate date) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<ReminderResponse> result = reminderService.getRemindersByDate(userId, date);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReminderResponse>> createReminder(
            @Valid @RequestBody ReminderRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        ReminderResponse result = reminderService.createReminder(userId, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReminder(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        reminderService.deleteReminder(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
