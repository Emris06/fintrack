package com.fintrack.dto.response;

import com.fintrack.entity.enums.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private String icon;
    private String color;
    private CategoryType type;
    private Boolean isSystem;
}
