package com.fintrack.controller;

import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.CategoryResponse;
import com.fintrack.service.CategoryService;
import com.fintrack.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CategoryResponse> result = categoryService.getCategories(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/system")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getSystemCategories() {
        List<CategoryResponse> result = categoryService.getSystemCategories();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
