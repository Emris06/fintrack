package com.fintrack.repository;

import com.fintrack.entity.FamilyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {

    List<FamilyGroup> findByOwnerId(Long ownerId);

    @Query("SELECT DISTINCT fg FROM FamilyGroup fg JOIN FamilyMember fm ON fm.group = fg WHERE fm.user.id = :userId")
    List<FamilyGroup> findByMemberUserId(@Param("userId") Long userId);
}
