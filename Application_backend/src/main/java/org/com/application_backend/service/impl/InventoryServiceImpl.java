package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.InventoryDTO;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.InventoryRepository;
import org.com.application_backend.service.custom.InventoryService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ModelMapper modelMapper;

    @Override
    public InventoryDTO save(InventoryDTO dto) throws Exception {
        if (ifExit(dto.getInventory_id())) {
            throw new CustomException("inventory already registered");
        }
        return modelMapper.map(inventoryRepository.save(modelMapper.map(dto, Inventory.class)), InventoryDTO.class);
    }

    @Override
    public InventoryDTO update(InventoryDTO dto) throws Exception {
        if (!ifExit(dto.getInventory_id())) {
            throw new CustomException("inventory not found");
        }
        return modelMapper.map(inventoryRepository.save(modelMapper.map(dto, Inventory.class)), InventoryDTO.class);
    }

    @Override
    public List<InventoryDTO> getAll() throws Exception {
        List<InventoryDTO> dtos = new ArrayList<>();
        inventoryRepository.findAll().forEach(inventory -> {
            dtos.add(modelMapper.map(inventory, InventoryDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        inventoryRepository.deleteById(id);
    }

    @Override
    public InventoryDTO find(String id) throws Exception {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("inventory not found"));
        return modelMapper.map(inventory, InventoryDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return inventoryRepository.existsById(id);
    }
}
