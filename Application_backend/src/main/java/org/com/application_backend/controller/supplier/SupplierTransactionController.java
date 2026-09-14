package org.com.application_backend.controller.supplier;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierTransactionDTO;
import org.com.application_backend.service.custom.supplier.SupplierTransactionService;
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
    public List<SupplierTransactionDTO> getAllSupplierTransactions() throws Exception {
        return supplierTransactionService.getAll();
    }

    @GetMapping("/{id}")
    public SupplierTransactionDTO getSupplierTransaction(@PathVariable String id) throws Exception {
        return supplierTransactionService.find(id);
    }

    @PostMapping
    public SupplierTransactionDTO saveSupplierTransaction(@RequestBody SupplierTransactionDTO dto) throws Exception {
        return supplierTransactionService.save(dto);
    }

    @PutMapping
    public SupplierTransactionDTO updateSupplierTransaction(@RequestBody SupplierTransactionDTO dto) throws Exception {
        return supplierTransactionService.update(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteSupplierTransaction(@PathVariable String id) throws Exception {
        supplierTransactionService.delete(id);
    }
}
