package com.fintrack.repository;

import com.fintrack.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Returns both system categories (user is null) and user-specific categories.
     */
    List<Category> findByUserIsNullOrUserId(Long userId);

    /**
     * Returns only system-defined categories.
     */
    List<Category> findByUserIsNullAndIsSystemTrue();

    /**
     * Returns only custom categories created by a specific user.
     */
    List<Category> findByUserId(Long userId);
}
