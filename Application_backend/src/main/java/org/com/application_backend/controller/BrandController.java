package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.BrandDTO;
import org.com.application_backend.service.custom.BrandService;
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
@RequestMapping("/api/brand")
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<APIResponse<List<BrandDTO>>> getAllBrands() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Brands retrieved successfully", brandService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<BrandDTO>> getBrand(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Brand retrieved successfully", brandService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<BrandDTO>> saveBrand(@RequestBody BrandDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Brand created successfully", brandService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<BrandDTO>> updateBrand(@RequestBody BrandDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Brand updated successfully", brandService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteBrand(@PathVariable String id) throws Exception {
        brandService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Brand deleted successfully", null));
    }
}
