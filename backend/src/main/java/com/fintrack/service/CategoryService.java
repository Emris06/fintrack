package com.fintrack.service;

import com.fintrack.dto.response.CategoryResponse;
import com.fintrack.entity.Category;
import com.fintrack.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Retrieve all categories available to a user, including system-wide categories
     * and the user's own custom categories.
     *
     * @param userId the owner's user id
     * @return list of CategoryResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(Long userId) {
        log.debug("Fetching all categories for user id: {}", userId);

        return categoryRepository.findByUserIsNullOrUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve only system-defined categories (shared across all users).
     *
     * @return list of system CategoryResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getSystemCategories() {
        log.debug("Fetching system categories");

        return categoryRepository.findByUserIsNullAndIsSystemTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .type(category.getType())
                .isSystem(category.getIsSystem())
                .build();
    }
}
