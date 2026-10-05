package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.entity.Brand;
import org.com.application_backend.entity.Category;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.sparepart.Img;
import org.com.application_backend.entity.sparepart.SparePart;
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
import org.springframework.web.multipart.MultipartFile;

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
        return save(dto, false);
    }

    @Override
    @Transactional
    public SparePartDTO save(SparePartDTO dto, boolean state) throws Exception {
        return save(dto, null, state);
    }

    @Transactional
    public SparePartDTO save(SparePartDTO dto, MultipartFile img, boolean state) throws Exception {

        if (ifExit(dto.getPartID())) {
            throw new CustomException("spare part already registered");
        }

        SparePart sparePart = modelMapper.map(dto, SparePart.class);

        if (img != null && !img.isEmpty()) {
            Img image = new Img();
            image.setImgName(img.getOriginalFilename());
            image.setImgType(img.getContentType());
            image.setImgData(img.getBytes());
            sparePart.setImage(image);
        }

        if (dto.getSuppliers() != null) {
            List<Supplier> suppliers = new ArrayList<>();

            for (SupplierDTO sDto : dto.getSuppliers()) {
                if (sDto != null && sDto.getSupplierID() != null) {
                    supplierRepository.findById(sDto.getSupplierID()).ifPresent(suppliers::add);
                }
            }

            sparePart.setSuppliers(suppliers);
        } else {
            sparePart.setSuppliers(new ArrayList<>());
        }

        SparePart savedSparePart = sparePartRepository.save(sparePart);

        if (state) {
            Inventory existingInventory = inventoryRepository.getInventoryByPart(savedSparePart);

            if (existingInventory == null) {
                Inventory inventory = new Inventory(inventoryService.getLastID(), savedSparePart, 0, 0, null);

                inventoryRepository.save(inventory);
            }
        }

        return toDTO(savedSparePart);
    }

    @Override
    @Transactional
    public SparePartDTO update(SparePartDTO dto) throws Exception {

        SparePart sparePart = updateRDY(dto);

        if (dto.getImage() != null) {
            Img image = modelMapper.map(dto.getImage(), Img.class);

            if (sparePart.getImage() != null) {
                image.setId(sparePart.getImage().getId());
            }

            sparePart.setImage(image);
        }

        SparePart updatedSparePart = sparePartRepository.save(sparePart);

        return toDTO(updatedSparePart);
    }

    @Override
    @Transactional
    public SparePartDTO update(SparePartDTO dto, MultipartFile img) throws Exception {

        SparePart sparePart = updateRDY(dto);

        if (img != null && !img.isEmpty()) {

            Img image = new Img();

            if (sparePart.getImage() != null) {
                image.setId(sparePart.getImage().getId());
            }

            image.setImgName(img.getOriginalFilename());
            image.setImgType(img.getContentType());
            image.setImgData(img.getBytes());

            sparePart.setImage(image);
        }

        SparePart updatedSparePart = sparePartRepository.save(sparePart);

        return toDTO(updatedSparePart);
    }

    @Transactional
    public SparePart updateRDY(SparePartDTO dto) throws Exception {

        SparePart sparePart = sparePartRepository.findById(dto.getPartID()).orElseThrow(() -> new CustomException("spare part not found"));

        sparePart.setPartName(dto.getPartName());
        sparePart.setCostPrice(dto.getCostPrice());
        sparePart.setSellPrice(dto.getSellPrice());

        if (dto.getSuppliers() != null) {

            List<Supplier> suppliers = new ArrayList<>();

            for (SupplierDTO sDto : dto.getSuppliers()) {
                if (sDto != null && sDto.getSupplierID() != null) {
                    supplierRepository.findById(sDto.getSupplierID()).ifPresent(suppliers::add);
                }
            }

            if (sparePart.getSuppliers() == null) {
                sparePart.setSuppliers(suppliers);
            } else {
                sparePart.getSuppliers().clear();
                sparePart.getSuppliers().addAll(suppliers);
            }
        }

        if (dto.getBrand() != null && dto.getBrand().getBrandID() != null) {

            sparePart.setBrand(modelMapper.map(dto.getBrand(), Brand.class));
        }

        if (dto.getCategory() != null && dto.getCategory().getCategoryId() != 0) {

            sparePart.setCategory(modelMapper.map(dto.getCategory(), Category.class));
        }

        return sparePart;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SparePartDTO> getAll() throws Exception {

        return sparePartRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SparePartDTO> getBySupplier(String supplierID) throws Exception {

        Supplier supplier = supplierRepository.findById(supplierID).orElseThrow(() -> new CustomException("Supplier not found: " + supplierID));

        return sparePartRepository.findBySuppliers(supplier).stream().map(this::toDTO).toList();
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {

        SparePart sparePart = sparePartRepository.findById(id).orElseThrow(() -> new CustomException("Spare part not found"));

        List<Order> orders = orderRepository.findAllBySpareParts(sparePart);

        for (Order order : orders) {
            OrderStatus status = order.getOrderStatus();
            if (status != OrderStatus.CANCELLED && status != OrderStatus.RETURNED && status != OrderStatus.DELIVERED) {
                throw new CustomException("Cannot delete spare part because it is associated with an active order");
            }
        }

        orderRepository.removeSparePartFromOrders(id);

        sparePart = sparePartRepository.findById(id).orElseThrow(() -> new CustomException("Spare part not found"));

        if (sparePart.getSuppliers() != null) {
            sparePart.getSuppliers().clear();
        }

        sparePartRepository.delete(sparePart);
    }

    @Override
    @Transactional(readOnly = true)
    public SparePartDTO find(String id) throws Exception {

        SparePart sparePart = sparePartRepository.findById(id).orElseThrow(() -> new CustomException("spare part not found"));

        return toDTO(sparePart);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {
        return sparePartRepository.existsById(id);
    }

    private SparePartDTO toDTO(SparePart sparePart) {

        SparePartDTO dto = modelMapper.map(sparePart, SparePartDTO.class);

        if (sparePart.getSuppliers() != null) {

            List<SupplierDTO> supplierDTOs = sparePart.getSuppliers().stream().map(s -> modelMapper.map(s, SupplierDTO.class)).toList();

            dto.setSuppliers(supplierDTOs);
        }

        return dto;
    }
}