package org.com.application_backend.service.impl.supplier;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.entity.sparepart.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.repo.Supplier.SupplierRepository;
import org.com.application_backend.service.custom.supplier.SupplierService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final ModelMapper modelMapper;
    private final SparePartRepository sparePartRepository;

    @Override
    public SupplierDTO save(SupplierDTO dto) throws Exception {
        if (ifExit(dto.getSupplierID())) {
            throw new CustomException("supplier already registered");
        }
        validateSupplier(dto);
        return modelMapper.map(supplierRepository.save(modelMapper.map(dto, Supplier.class)), SupplierDTO.class);
    }

    public void validateSupplier(SupplierDTO dto) throws CustomException {

        if (supplierRepository.existsByEmail(dto.getEmail())) {
            throw new CustomException("supplier E-mail is already registered");
        }
        if (supplierRepository.existsByPhone(dto.getPhone())) {
            throw new CustomException("supplier Phone number is already registered");
        }
    }

    @Override
    public SupplierDTO update(SupplierDTO dto) throws Exception {

        Supplier supplier = supplierRepository.findById(dto.getSupplierID())
                .orElseThrow(() -> new CustomException("Supplier not found"));

        if (!Objects.equals(supplier.getEmail(), dto.getEmail())
                && supplierRepository.existsByEmail(dto.getEmail())) {
            throw new CustomException("Supplier E-mail is already registered");
        }

        if (!Objects.equals(supplier.getPhone(), dto.getPhone())
                && supplierRepository.existsByPhone(dto.getPhone())) {
            throw new CustomException("Supplier Phone number is already registered");
        }

        modelMapper.map(dto, supplier);

        return modelMapper.map(
                supplierRepository.save(supplier),
                SupplierDTO.class
        );
    }

    @Override
    public List<SupplierDTO> getAll() throws Exception {
        List<SupplierDTO> dtos = new ArrayList<>();
        supplierRepository.findAll().forEach(supplier -> {
            dtos.add(modelMapper.map(supplier, SupplierDTO.class));
        });
        return dtos;
    }
    @Override
    @Transactional
    public void delete(String id) throws Exception {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new CustomException("Supplier not found"));

        List<SparePart> spareParts = sparePartRepository.findBySuppliers(supplier);

        for (SparePart sparePart : spareParts) {
            sparePart.getSuppliers().remove(supplier);
        }

        sparePartRepository.saveAll(spareParts);

        supplierRepository.delete(supplier);
    }

    @Override
    public SupplierDTO find(String id) throws Exception {
        Supplier supplier = supplierRepository.findById(id).orElseThrow(() -> new CustomException("supplier not found"));
        return modelMapper.map(supplier, SupplierDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return supplierRepository.existsById(id);
    }

    @Override
    @Transactional
    public void updateSuppliedSpareParts(String supplierID, List<String> partIDs) throws Exception {
        Supplier supplier = supplierRepository.findById(supplierID)
                .orElseThrow(() -> new CustomException("Supplier not found: " + supplierID));

        List<SparePart> currentlySupplied = sparePartRepository.findBySuppliers(supplier);
        List<String> targetIds = (partIDs != null) ? partIDs : new ArrayList<>();

        // 1. Remove supplier from parts that are no longer selected
        for (SparePart part : currentlySupplied) {
            if (!targetIds.contains(part.getPartID())) {
                if (part.getSuppliers() != null) {
                    part.getSuppliers().removeIf(s -> s.getSupplierID().equals(supplierID));
                    sparePartRepository.save(part);
                }
            }
        }

        // 2. Add supplier to parts that are newly selected
        for (String partId : targetIds) {
            SparePart part = sparePartRepository.findById(partId).orElse(null);
            if (part != null) {
                if (part.getSuppliers() == null) {
                    part.setSuppliers(new ArrayList<>());
                }
                boolean alreadyLinked = part.getSuppliers().stream()
                        .anyMatch(s -> s.getSupplierID().equals(supplierID));
                if (!alreadyLinked) {
                    part.getSuppliers().add(supplier);
                    sparePartRepository.save(part);
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SparePartDTO> getSuppliedSpareParts(String supplierID) throws Exception {
        Supplier supplier = supplierRepository.findById(supplierID)
                .orElseThrow(() -> new CustomException("Supplier not found: " + supplierID));
        List<SparePartDTO> dtos = new ArrayList<>();
        sparePartRepository.findBySuppliers(supplier).forEach(sp -> {
            SparePartDTO dto = modelMapper.map(sp, SparePartDTO.class);
            if (sp.getSuppliers() != null) {
                dto.setSuppliers(sp.getSuppliers().stream()
                        .map(s -> modelMapper.map(s, SupplierDTO.class))
                        .toList());
            }
            dtos.add(dto);
        });
        return dtos;
    }
}
