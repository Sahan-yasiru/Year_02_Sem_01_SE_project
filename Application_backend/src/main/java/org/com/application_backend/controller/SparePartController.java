package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;
import org.com.application_backend.service.custom.SparePartService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/spare-part")
public class SparePartController {

    private final SparePartService sparePartService;

    @GetMapping
    public ResponseEntity<APIResponse<List<SparePartDTO>>> getAllSpareParts() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare parts retrieved successfully", sparePartService.getAll()));
    }

    @GetMapping("/by-supplier/{supplierId}")
    public ResponseEntity<APIResponse<List<SparePartDTO>>> getSparePartsBySupplier(@PathVariable String supplierId) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare parts for supplier retrieved successfully", sparePartService.getBySupplier(supplierId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<SparePartDTO>> getSparePart(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part retrieved successfully", sparePartService.find(id)));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> saveSparePart(@RequestBody SparePartDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part created successfully", sparePartService.save(dto,true)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> saveSparePart(
            @RequestPart("sparePart") SparePartDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part created successfully", sparePartService.save(dto, img, true)));
    }

    @PostMapping(value = "/without-inventory", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> saveSparePartWithOutInvent(@RequestBody SparePartDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part created successfully", sparePartService.save(dto,false)));
    }

    @PostMapping(value = "/without-inventory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> saveSparePartWithoutInventory(
            @RequestPart("sparePart") SparePartDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part created successfully", sparePartService.save(dto, img, false)));
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> updateSparePart(@RequestBody SparePartDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part updated successfully", sparePartService.update(dto)));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<SparePartDTO>> updateSparePart(
            @RequestPart("sparePart") SparePartDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part updated successfully", sparePartService.update(dto, img)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteSparePart(@PathVariable String id) throws Exception {
        sparePartService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part deleted successfully", null));
    }
}
