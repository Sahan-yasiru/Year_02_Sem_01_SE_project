package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.InventoryDTO;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.InventoryRepository;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.service.custom.InventoryService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final SparePartRepository sparePartRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public InventoryDTO save(InventoryDTO dto) throws Exception {
        if (dto.getInventory_id() != null && ifExit(dto.getInventory_id())) {
            throw new CustomException("inventory already registered");
        }
        if (dto.getInventory_id() == null) {
            dto.setInventory_id(getLastID());
        }

        Inventory inventory = new Inventory();
        inventory.setInventory_id(dto.getInventory_id());
        inventory.setQuantity_on_hand(dto.getQuantity_on_hand());
        inventory.setReorder_threshold(dto.getReorder_threshold());

        if (dto.getPart() != null && dto.getPart().getPartID() != null) {
            SparePart part = sparePartRepository.findById(dto.getPart().getPartID())
                    .orElseThrow(() -> new CustomException("Spare part not found"));
            inventory.setPart(part);
        }

        return modelMapper.map(inventoryRepository.save(inventory), InventoryDTO.class);
    }

    @Override
    @Transactional
    public InventoryDTO update(InventoryDTO dto) throws Exception {
        Inventory existing = inventoryRepository.findById(dto.getInventory_id())
                .orElseThrow(() -> new CustomException("inventory not found"));

        existing.setQuantity_on_hand(dto.getQuantity_on_hand());
        existing.setReorder_threshold(dto.getReorder_threshold());

        if (dto.getPart() != null && dto.getPart().getPartID() != null) {
            SparePart part = sparePartRepository.findById(dto.getPart().getPartID())
                    .orElseThrow(() -> new CustomException("Spare part not found"));
            existing.setPart(part);
        }

        return modelMapper.map(inventoryRepository.save(existing), InventoryDTO.class);
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
    @Override
    public String getLastID() {
        List<String> ids = inventoryRepository.getLastInventory();
        if (ids.isEmpty()) {
            return "I001";
        }
        int num = Integer.parseInt(ids.getFirst().substring(1));
        num++;
        return String.format("I%03d", num);
    }
}
