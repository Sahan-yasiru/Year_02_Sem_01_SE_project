package org.com.application_backend.controller.supplier;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierTransactionDTO;
import org.com.application_backend.service.custom.supplier.SupplierTransactionService;
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
@RequestMapping("/api/supplier-transaction")
public class SupplierTransactionController {

    private final SupplierTransactionService supplierTransactionService;

    @GetMapping
    public ResponseEntity<APIResponse<List<SupplierTransactionDTO>>> getAllSupplierTransactions() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier transactions retrieved successfully", supplierTransactionService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<SupplierTransactionDTO>> getSupplierTransaction(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier transaction retrieved successfully", supplierTransactionService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<SupplierTransactionDTO>> saveSupplierTransaction(@RequestBody SupplierTransactionDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier transaction created successfully", supplierTransactionService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<SupplierTransactionDTO>> updateSupplierTransaction(@RequestBody SupplierTransactionDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier transaction updated successfully", supplierTransactionService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteSupplierTransaction(@PathVariable String id) throws Exception {
        supplierTransactionService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Supplier transaction deleted successfully", null));
    }
}
