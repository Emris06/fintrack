package com.fintrack.repository;

import com.fintrack.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUserIdAndReminderDateBetweenOrderByReminderDateAsc(
            Long userId, LocalDate from, LocalDate to);

    List<Reminder> findByUserIdAndReminderDateOrderByCreatedAtDesc(Long userId, LocalDate date);

    Optional<Reminder> findByIdAndUserId(Long id, Long userId);
}
