package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.InventoryDTO;
import org.com.application_backend.service.custom.InventoryService;
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
    public List<InventoryDTO> getAllInventory() throws Exception {
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public InventoryDTO getInventory(@PathVariable String id) throws Exception {
        return inventoryService.find(id);
    }

    @PostMapping
    public InventoryDTO saveInventory(@RequestBody InventoryDTO dto) throws Exception {
        return inventoryService.save(dto);
    }

    @PutMapping
    public InventoryDTO updateInventory(@RequestBody InventoryDTO dto) throws Exception {
        return inventoryService.update(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteInventory(@PathVariable String id) throws Exception {
        inventoryService.delete(id);
    }
}
