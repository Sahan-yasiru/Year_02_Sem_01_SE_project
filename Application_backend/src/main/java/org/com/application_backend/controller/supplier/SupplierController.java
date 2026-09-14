package org.com.application_backend.controller.supplier;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.service.custom.supplier.SupplierService;
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
@RequestMapping("/api/supplier")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<APIResponse<List<SupplierDTO>>> getAllSuppliers() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Suppliers retrieved successfully", supplierService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<SupplierDTO>> getSupplier(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier retrieved successfully", supplierService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<SupplierDTO>> saveSupplier(@RequestBody SupplierDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier created successfully", supplierService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<SupplierDTO>> updateSupplier(@RequestBody SupplierDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier updated successfully", supplierService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteSupplier(@PathVariable String id) throws Exception {
        supplierService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier deleted successfully", null));
    }
}
