package com.fintrack.service;

import com.fintrack.dto.request.ReminderRequest;
import com.fintrack.dto.response.ReminderResponse;
import com.fintrack.entity.Reminder;
import com.fintrack.entity.User;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;

    @Transactional(readOnly = true)
    public List<ReminderResponse> getRemindersByMonth(Long userId, int year, int month) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        return reminderRepository.findByUserIdAndReminderDateBetweenOrderByReminderDateAsc(userId, from, to)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> getRemindersByDate(Long userId, LocalDate date) {
        return reminderRepository.findByUserIdAndReminderDateOrderByCreatedAtDesc(userId, date)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ReminderResponse createReminder(Long userId, ReminderRequest request) {
        log.info("Creating reminder for user id: {}, date: {}", userId, request.getReminderDate());

        Reminder reminder = Reminder.builder()
                .user(User.builder().id(userId).build())
                .description(request.getDescription())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .reminderDate(request.getReminderDate())
                .build();

        reminder = reminderRepository.save(reminder);
        return mapToResponse(reminder);
    }

    public void deleteReminder(Long userId, Long reminderId) {
        Reminder reminder = reminderRepository.findByIdAndUserId(reminderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", "id", reminderId));
        reminderRepository.delete(reminder);
        log.info("Deleted reminder id: {} for user id: {}", reminderId, userId);
    }

    private ReminderResponse mapToResponse(Reminder reminder) {
        return ReminderResponse.builder()
                .id(reminder.getId())
                .description(reminder.getDescription())
                .amount(reminder.getAmount())
                .currency(reminder.getCurrency())
                .reminderDate(reminder.getReminderDate())
                .createdAt(reminder.getCreatedAt())
                .build();
    }
}
