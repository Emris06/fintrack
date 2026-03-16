package com.fintrack.scheduler;

import com.fintrack.ai.AiService;
import com.fintrack.entity.User;
import com.fintrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationScheduler {

    private final AiService aiService;
    private final UserRepository userRepository;

    /**
     * Runs daily at 8:00 AM to check all active users for anomalies,
     * budget alerts, and debt reminders, creating notifications as needed.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void generateDailyNotifications() {
        log.info("Starting daily notification generation");

        List<User> users = userRepository.findAll();
        int count = 0;

        for (User user : users) {
            if (user.getIsActive() == null || !user.getIsActive()) {
                continue;
            }
            try {
                aiService.checkAndCreateNotifications(user.getId());
                count++;
            } catch (Exception e) {
                log.error("Failed to generate notifications for user id: {}", user.getId(), e);
            }
        }

        log.info("Daily notification generation complete. Processed {} users.", count);
    }
}
