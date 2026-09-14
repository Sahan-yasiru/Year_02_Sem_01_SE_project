package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.entity.Category;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.CategoryRepository;
import org.com.application_backend.service.custom.CategoryService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ModelMapper modelMapper;

    @Override
    public CategoryDTO save(CategoryDTO dto) throws Exception {
        if (ifExit(dto.getCategoryName())) {
            throw new CustomException("category name already registered");
        }
        return modelMapper.map(categoryRepository.save(modelMapper.map(dto, Category.class)), CategoryDTO.class);
    }

    @Override
    public CategoryDTO update(CategoryDTO dto) throws Exception {
        if (ifExit(dto.getCategoryName())) {
            throw new CustomException("category name already registered");
        }
        return modelMapper.map(categoryRepository.save(modelMapper.map(dto, Category.class)), CategoryDTO.class);
    }

    @Override
    public List<CategoryDTO> getAll() throws Exception {
        List<CategoryDTO> dtos = new ArrayList<>();
        categoryRepository.findAll().forEach(category -> {
            dtos.add(modelMapper.map(category, CategoryDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        categoryRepository.deleteById(Integer.parseInt(id));
    }

    @Override
    public CategoryDTO find(String id) throws Exception {
        return modelMapper.map(categoryRepository.findById(Integer.parseInt(id)), CategoryDTO.class);
    }

    @Override
    public boolean ifExit(String categoryName) throws Exception {
        return categoryRepository.existsByCategoryName(categoryName);
    }
}
