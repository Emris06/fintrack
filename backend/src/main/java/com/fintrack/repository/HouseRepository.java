package com.fintrack.repository;

import com.fintrack.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HouseRepository extends JpaRepository<House, Long> {

    List<House> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<House> findByIdAndUserId(Long id, Long userId);
}
