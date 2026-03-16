package com.fintrack.repository;

import com.fintrack.entity.AiCategoryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiCategoryRuleRepository extends JpaRepository<AiCategoryRule, Long> {

    /**
     * Finds rules where the keyword is contained within the given description (case insensitive).
     * Results are ordered by confidence descending so the most confident match comes first.
     */
    @Query("SELECT r FROM AiCategoryRule r " +
           "WHERE LOWER(:description) LIKE CONCAT('%', LOWER(r.keyword), '%') " +
           "ORDER BY r.confidence DESC")
    List<AiCategoryRule> findMatchingRules(@Param("description") String description);

    /**
     * Returns only system-defined rules.
     */
    List<AiCategoryRule> findByUserIsNullAndIsSystemTrue();

    /**
     * Returns rules that belong to the given user or are system rules.
     */
    List<AiCategoryRule> findByUserIdOrIsSystemTrue(Long userId);
}
