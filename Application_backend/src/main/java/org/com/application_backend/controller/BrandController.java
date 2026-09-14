package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.BrandDTO;
import org.com.application_backend.service.custom.BrandService;
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
@RequestMapping("/api/brand")
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public List<BrandDTO> getAllBrands() throws Exception {
        return brandService.getAll();
    }

    @GetMapping("/{id}")
    public BrandDTO getBrand(@PathVariable String id) throws Exception {
        return brandService.find(id);
    }

    @PostMapping
    public BrandDTO saveBrand(@RequestBody BrandDTO dto) throws Exception {
        return brandService.save(dto);
    }

    @PutMapping
    public BrandDTO updateBrand(@RequestBody BrandDTO dto) throws Exception {
        return brandService.update(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteBrand(@PathVariable String id) throws Exception {
        brandService.delete(id);
    }
}
