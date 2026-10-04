package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.entity.order.OrderStatus;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.InventoryRepository;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.repo.Supplier.SupplierRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.InventoryService;
import org.com.application_backend.service.custom.SparePartService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class SparePartServiceImpl implements SparePartService {

    private final SparePartRepository sparePartRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final ModelMapper modelMapper;
    private final OrderRepository orderRepository;
    private final SupplierRepository supplierRepository;

    @Override
    public SparePartDTO save(SparePartDTO dto) throws Exception {
        return null;
    }

    @Override
    @Transactional
    public SparePartDTO save(SparePartDTO dto, boolean state) throws Exception {

        if (ifExit(dto.getPartID())) {
            throw new CustomException("spare part already registered");
        }

        SparePart sparePart = modelMapper.map(dto, SparePart.class);

        SparePart savedSparePart = sparePartRepository.save(sparePart);

        if (state) {

            Inventory existingInventory = inventoryRepository.getInventoryByPart(savedSparePart);

            if (existingInventory == null) {

                Inventory inventory = new Inventory(inventoryService.getLastID(), savedSparePart, 0, 0, null);

                inventoryRepository.save(inventory);
            }
        }

        return modelMapper.map(savedSparePart, SparePartDTO.class);
    }

    @Override
    @Transactional
    public SparePartDTO update(SparePartDTO dto) throws Exception {

        SparePart sparePart = sparePartRepository.findById(dto.getPartID()).orElseThrow(() -> new CustomException("spare part not found"));

        sparePart.setPartName(dto.getPartName());
        sparePart.setCostPrice(dto.getCostPrice());
        sparePart.setSellPrice(dto.getSellPrice());

        // If your DTO contains suppliers, brand and category,
        // update them here using their existing database entities.

        SparePart updatedSparePart = sparePartRepository.save(sparePart);

        return modelMapper.map(updatedSparePart, SparePartDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SparePartDTO> getAll() throws Exception {

        List<SparePartDTO> dtos = new ArrayList<>();

        sparePartRepository.findAll().forEach(sparePart -> dtos.add(modelMapper.map(sparePart, SparePartDTO.class)));

        return dtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SparePartDTO> getBySupplier(String supplierID) throws Exception {
        Supplier supplier = supplierRepository.findById(supplierID)
                .orElseThrow(() -> new CustomException("Supplier not found: " + supplierID));
        List<SparePartDTO> dtos = new ArrayList<>();
        sparePartRepository.findBySuppliers(supplier)
                .forEach(sp -> dtos.add(modelMapper.map(sp, SparePartDTO.class)));
        return dtos;
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {

        SparePart sparePart = sparePartRepository.findById(id).orElseThrow(() -> new CustomException("Spare part not found"));

        List<Order> orders = orderRepository.findAllBySpareParts(sparePart);
        List<Order> ordersTOBECancelled = new ArrayList<>();

        for (Order order : orders) {

            OrderStatus status = order.getOrderStatus();

            if (status != OrderStatus.CANCELLED && status != OrderStatus.RETURNED&& status != OrderStatus.DELIVERED) {

                throw new CustomException("Cannot delete spare part because it is associated with an active order");
            }
        }
        // Remove the join-table rows from the DB.
        // clearAutomatically = true on the query evicts the entire Hibernate 1st-level
        // cache, so no managed Order in the session can still reference the SparePart.
        orderRepository.removeSparePartFromOrders(id);

        // sparePart is now detached (session was cleared above); re-fetch it as a
        // fresh managed entity before touching lazy collections or deleting.
        sparePart = sparePartRepository.findById(id)
                .orElseThrow(() -> new CustomException("Spare part not found"));

        if (sparePart.getSuppliers() != null) {
            sparePart.getSuppliers().clear();
        }
        ordersTOBECancelled.forEach(order -> order.setOrderStatus(OrderStatus.CANCELLED));
        orderRepository.saveAll(ordersTOBECancelled);
        sparePartRepository.delete(sparePart);
    }

    @Override
    @Transactional(readOnly = true)
    public SparePartDTO find(String id) throws Exception {

        SparePart sparePart = sparePartRepository.findById(id).orElseThrow(() -> new CustomException("spare part not found"));

        return modelMapper.map(sparePart, SparePartDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {

        return sparePartRepository.existsById(id);
    }
}