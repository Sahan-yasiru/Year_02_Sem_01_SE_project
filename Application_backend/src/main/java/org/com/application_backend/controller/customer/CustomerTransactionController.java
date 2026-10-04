package org.com.application_backend.controller.customer;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerTransactionDTO;
import org.com.application_backend.dto.Customer.CustomerTransactionEntryDTO;
import org.com.application_backend.service.custom.customer.CustomerTransactionService;
import org.com.application_backend.util.APIResponse;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CustomerTransactionController — REST controller for customer sale transactions.
 * Base path: /api/customerTransaction
 *
 * Uses CustomerTransactionEntryDTO as the request body for POST/PUT so the
 * client never needs to supply the auto-generated saleID on creation.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/customerTransaction")
public class CustomerTransactionController {

    private final CustomerTransactionService customerTransactionService;
    private final ModelMapper modelMapper;

    /** GET /api/customerTransaction — retrieve all transactions */
    @GetMapping
    public ResponseEntity<APIResponse<List<CustomerTransactionDTO>>> getAllTransactions()
            throws Exception {
        return ResponseEntity.ok(new APIResponse<>(
                200,
                "Customer transactions retrieved successfully",
                customerTransactionService.getAll()));
    }

    /** GET /api/customerTransaction/{id} — retrieve a single transaction by saleID */
    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<CustomerTransactionDTO>> getTransaction(
            @PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(
                200,
                "Customer transaction retrieved successfully",
                customerTransactionService.find(id)));
    }

    /**
     * POST /api/customerTransaction — create a new transaction.
     * Accepts CustomerTransactionEntryDTO (no saleID field) and delegates to the service.
     */
    @PostMapping
    public ResponseEntity<APIResponse<CustomerTransactionDTO>> saveTransaction(
            @RequestBody CustomerTransactionEntryDTO entryDTO) throws Exception {
        // Map the entry DTO to the full DTO (saleID will be 0 / default, ignored on insert)
        CustomerTransactionDTO dto = modelMapper.map(entryDTO, CustomerTransactionDTO.class);
        return ResponseEntity.ok(new APIResponse<>(
                200,
                "Customer transaction created successfully",
                customerTransactionService.save(dto)));
    }

    /**
     * PUT /api/customerTransaction/{id} — update an existing transaction.
     * The saleID is taken from the path variable and injected into the DTO.
     */
    @PutMapping("/{id}")
    public ResponseEntity<APIResponse<CustomerTransactionDTO>> updateTransaction(
            @PathVariable String id,
            @RequestBody CustomerTransactionEntryDTO entryDTO) throws Exception {
        CustomerTransactionDTO dto = modelMapper.map(entryDTO, CustomerTransactionDTO.class);
        dto.setSaleID(Integer.parseInt(id));
        return ResponseEntity.ok(new APIResponse<>(
                200,
                "Customer transaction updated successfully",
                customerTransactionService.update(dto)));
    }

    /** DELETE /api/customerTransaction/{id} — delete a transaction by saleID */
    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteTransaction(
            @PathVariable String id) throws Exception {
        customerTransactionService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(
                200,
                "Customer transaction deleted successfully",
                null));
    }
}
