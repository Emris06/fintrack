package com.fintrack.repository;

import com.fintrack.entity.HouseService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HouseServiceRepository extends JpaRepository<HouseService, Long> {

    List<HouseService> findByHouseIdOrderByCreatedAtDesc(Long houseId);

    Optional<HouseService> findByIdAndHouseId(Long id, Long houseId);
}
