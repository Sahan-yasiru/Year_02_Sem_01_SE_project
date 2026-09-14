package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.service.custom.CategoryService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/category")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<APIResponse<List<CategoryDTO>>> getAllCategories() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Categories retrieved successfully", categoryService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<CategoryDTO>> getCategory(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Category retrieved successfully", categoryService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<CategoryDTO>> saveCategory(@RequestBody CategoryDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Category created successfully", categoryService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<CategoryDTO>> updateCategory(@RequestBody CategoryDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Category updated successfully", categoryService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteCategory(@PathVariable String id) throws Exception {
        categoryService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Category deleted successfully", null));
    }
}
