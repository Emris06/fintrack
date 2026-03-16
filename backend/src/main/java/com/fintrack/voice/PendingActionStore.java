package com.fintrack.voice;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PendingActionStore {

    private static final Duration TTL = Duration.ofMinutes(5);
    private final ConcurrentHashMap<String, PendingAction> store = new ConcurrentHashMap<>();

    public String save(PendingAction action) {
        String id = UUID.randomUUID().toString();
        action.setId(id);
        action.setCreatedAt(Instant.now());
        store.put(id, action);
        return id;
    }

    public Optional<PendingAction> get(String id) {
        PendingAction action = store.get(id);
        if (action == null) return Optional.empty();
        if (Instant.now().isAfter(action.getCreatedAt().plus(TTL))) {
            store.remove(id);
            return Optional.empty();
        }
        return Optional.of(action);
    }

    public void remove(String id) {
        store.remove(id);
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpired() {
        Instant cutoff = Instant.now().minus(TTL);
        store.entrySet().removeIf(e -> e.getValue().getCreatedAt().isBefore(cutoff));
    }
}
