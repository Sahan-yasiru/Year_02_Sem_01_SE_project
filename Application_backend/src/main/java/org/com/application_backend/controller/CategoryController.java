package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.service.custom.CategoryService;
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
    public List<CategoryDTO> getAllCategories() throws Exception {
        return categoryService.getAll();
    }

    @GetMapping("/{id}")
    public CategoryDTO getCategory(@PathVariable String id) throws Exception {
        return categoryService.find(id);
    }

    @PostMapping
    public CategoryDTO saveCategory(@RequestBody CategoryDTO dto) throws Exception {
        return categoryService.save(dto);
    }

    @PutMapping
    public CategoryDTO updateCategory(@RequestBody CategoryDTO dto) throws Exception {
        return categoryService.update(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable String id) throws Exception {
        categoryService.delete(id);
    }
}
