package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.InventoryDTO;
import org.com.application_backend.service.custom.InventoryService;
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
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<APIResponse<List<InventoryDTO>>> getAllInventory() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Inventory retrieved successfully", inventoryService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<InventoryDTO>> getInventory(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Inventory item retrieved successfully", inventoryService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<InventoryDTO>> saveInventory(@RequestBody InventoryDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Inventory item created successfully", inventoryService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<InventoryDTO>> updateInventory(@RequestBody InventoryDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Inventory item updated successfully", inventoryService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteInventory(@PathVariable String id) throws Exception {
        inventoryService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Inventory item deleted successfully", null));
    }
}
