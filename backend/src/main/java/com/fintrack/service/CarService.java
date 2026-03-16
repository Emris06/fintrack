package com.fintrack.service;

import com.fintrack.dto.request.CarRequest;
import com.fintrack.dto.response.CarResponse;
import com.fintrack.dto.response.FineResponse;
import com.fintrack.entity.Car;
import com.fintrack.entity.Fine;
import com.fintrack.entity.User;
import com.fintrack.entity.enums.FineStatus;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.CarRepository;
import com.fintrack.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final FineRepository fineRepository;

    /**
     * Retrieve all cars for a given user.
     *
     * @param userId the owner's user id
     * @return list of CarResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<CarResponse> getCars(Long userId) {
        log.debug("Fetching all cars for user id: {}", userId);

        return carRepository.findByUserId(userId)
                .stream()
                .map(this::mapToCarResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a single car by id, ensuring it belongs to the specified user.
     *
     * @param userId the owner's user id
     * @param carId  the car id
     * @return CarResponse DTO
     */
    @Transactional(readOnly = true)
    public CarResponse getCar(Long userId, Long carId) {
        log.debug("Fetching car id: {} for user id: {}", carId, userId);

        Car car = findCarByIdAndUserId(carId, userId);
        return mapToCarResponse(car);
    }

    /**
     * Create a new car for the specified user.
     *
     * @param userId  the owner's user id
     * @param request the car creation details
     * @return CarResponse DTO of the newly created car
     */
    public CarResponse createCar(Long userId, CarRequest request) {
        log.info("Creating new car '{}' for user id: {}", request.getLicensePlate(), userId);

        User user = new User();
        user.setId(userId);

        Car car = Car.builder()
                .user(user)
                .licensePlate(request.getLicensePlate())
                .registrationCertificate(request.getRegistrationCertificate())
                .nickname(request.getNickname())
                .build();

        car = carRepository.save(car);

        log.info("Car created with id: {} for user id: {}", car.getId(), userId);

        return mapToCarResponse(car);
    }

    /**
     * Delete a car belonging to the specified user.
     *
     * @param userId the owner's user id
     * @param carId  the car id to delete
     */
    public void deleteCar(Long userId, Long carId) {
        log.info("Deleting car id: {} for user id: {}", carId, userId);

        Car car = findCarByIdAndUserId(carId, userId);
        carRepository.delete(car);

        log.info("Car id: {} deleted successfully", carId);
    }

    /**
     * Retrieve all fines for a specific car belonging to the specified user.
     *
     * @param userId the owner's user id
     * @param carId  the car id
     * @return list of FineResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<FineResponse> getCarFines(Long userId, Long carId) {
        log.debug("Fetching fines for car id: {} for user id: {}", carId, userId);

        // Verify car belongs to user
        findCarByIdAndUserId(carId, userId);

        return fineRepository.findByCarId(carId)
                .stream()
                .map(this::mapToFineResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mark a fine as paid.
     *
     * @param userId the owner's user id
     * @param carId  the car id
     * @param fineId the fine id to pay
     * @return FineResponse DTO of the updated fine
     */
    public FineResponse payFine(Long userId, Long carId, Long fineId) {
        log.info("Paying fine id: {} for car id: {} for user id: {}", fineId, carId, userId);

        // Verify car belongs to user
        findCarByIdAndUserId(carId, userId);

        Fine fine = fineRepository.findByIdAndCarId(fineId, carId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", "id", fineId));

        fine.setStatus(FineStatus.PAID);
        fine.setPaidAt(LocalDateTime.now());

        fine = fineRepository.save(fine);

        log.info("Fine id: {} paid successfully", fineId);

        return mapToFineResponse(fine);
    }

    private CarResponse mapToCarResponse(Car car) {
        BigDecimal unpaidTotal = fineRepository.sumUnpaidFinesByCarId(car.getId());
        List<Fine> unpaidFines = fineRepository.findByCarIdAndStatus(car.getId(), FineStatus.UNPAID);

        return CarResponse.builder()
                .id(car.getId())
                .licensePlate(car.getLicensePlate())
                .registrationCertificate(car.getRegistrationCertificate())
                .nickname(car.getNickname())
                .unpaidFinesTotal(unpaidTotal)
                .unpaidFinesCount(unpaidFines.size())
                .createdAt(car.getCreatedAt())
                .build();
    }

    private FineResponse mapToFineResponse(Fine fine) {
        return FineResponse.builder()
                .id(fine.getId())
                .carId(fine.getCar().getId())
                .violationType(fine.getViolationType())
                .amount(fine.getAmount())
                .fineDate(fine.getFineDate().toString())
                .status(fine.getStatus().name())
                .paidAt(fine.getPaidAt())
                .createdAt(fine.getCreatedAt())
                .build();
    }

    private Car findCarByIdAndUserId(Long carId, Long userId) {
        return carRepository.findByIdAndUserId(carId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "id", carId));
    }
}
