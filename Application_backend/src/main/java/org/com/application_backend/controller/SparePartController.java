package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.service.custom.SparePartService;
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
@RequestMapping("/api/spare-part")
public class SparePartController {

    private final SparePartService sparePartService;

    @GetMapping
    public ResponseEntity<APIResponse<List<SparePartDTO>>> getAllSpareParts() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare parts retrieved successfully", sparePartService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<SparePartDTO>> getSparePart(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part retrieved successfully", sparePartService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<SparePartDTO>> saveSparePart(@RequestBody SparePartDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part created successfully", sparePartService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<SparePartDTO>> updateSparePart(@RequestBody SparePartDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part updated successfully", sparePartService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteSparePart(@PathVariable String id) throws Exception {
        sparePartService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Spare part deleted successfully", null));
    }
}
