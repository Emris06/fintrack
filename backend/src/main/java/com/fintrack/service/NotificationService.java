package com.fintrack.service;

import com.fintrack.dto.response.NotificationResponse;
import com.fintrack.entity.Notification;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.NotificationType;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Retrieve all notifications for a user, ordered by creation date descending.
     *
     * @param userId the owner's user id
     * @return list of NotificationResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        log.debug("Fetching all notifications for user id: {}", userId);

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the count of unread notifications for a user.
     *
     * @param userId the owner's user id
     * @return number of unread notifications
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        log.debug("Counting unread notifications for user id: {}", userId);

        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a specific notification as read.
     *
     * @param userId         the owner's user id
     * @param notificationId the notification id to mark as read
     * @return NotificationResponse DTO of the updated notification
     */
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        log.info("Marking notification id: {} as read for user id: {}", notificationId, userId);

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);

        log.info("Notification id: {} marked as read", notificationId);

        return mapToResponse(notification);
    }

    /**
     * Mark all unread notifications as read for a user.
     *
     * @param userId the owner's user id
     * @return number of notifications marked as read
     */
    public int markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user id: {}", userId);
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    /**
     * Create a new notification for a user with duplicate prevention.
     * Won't create if same type+title exists within last 24 hours.
     *
     * @param userId  the target user's id
     * @param type    the notification type
     * @param title   the notification title
     * @param message the notification message body
     */
    public void createNotification(Long userId, NotificationType type, String title, String message) {
        // Duplicate prevention: skip if same type+title exists within last 24 hours
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        if (notificationRepository.existsByUserIdAndTypeAndTitleAndCreatedAtAfter(userId, type, title, since)) {
            log.debug("Skipping duplicate notification for user id: {}, type: {}, title: {}", userId, type, title);
            return;
        }

        log.info("Creating {} notification for user id: {}, title: {}", type, userId, title);

        Notification notification = Notification.builder()
                .user(User.builder().id(userId).build())
                .type(type)
                .title(title)
                .message(message)
                .build();

        notificationRepository.save(notification);

        log.info("Notification created for user id: {}", userId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
