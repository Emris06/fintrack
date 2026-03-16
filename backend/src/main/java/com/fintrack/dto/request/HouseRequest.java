package com.fintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseRequest {

    @NotBlank(message = "House name is required")
    @Size(max = 100, message = "House name must not exceed 100 characters")
    private String houseName;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
}
