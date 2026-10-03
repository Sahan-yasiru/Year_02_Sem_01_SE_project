package org.com.application_backend.service.impl.supplier;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Supplier.SupplierRepository;
import org.com.application_backend.service.custom.supplier.SupplierService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final ModelMapper modelMapper;

    @Override
    public SupplierDTO save(SupplierDTO dto) throws Exception {
        if (ifExit(dto.getSupplierID())) {
            throw new CustomException("supplier already registered");
        }
        validateSupplier(dto);
        return modelMapper.map(supplierRepository.save(modelMapper.map(dto, Supplier.class)), SupplierDTO.class);
    }
    public void validateSupplier(SupplierDTO dto) throws CustomException {

        if(supplierRepository.existsByEmail(dto.getEmail())) {
            throw new CustomException("supplier E-mail is already registered");
        }
        if(supplierRepository.existsByPhone(dto.getPhone())) {
            throw new CustomException("supplier Phone number is already registered");
        }
    }

    @Override
    public SupplierDTO update(SupplierDTO dto) throws Exception {
        if (!ifExit(dto.getSupplierID())) {
            throw new CustomException("supplier not found");
        }
        if(!find(dto.getSupplierID()).equals(dto)) {
            validateSupplier(dto);
        }
        return modelMapper.map(supplierRepository.save(modelMapper.map(dto, Supplier.class)), SupplierDTO.class);
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
    public void delete(String id) throws Exception {
        supplierRepository.deleteById(id);
    }

    @Override
    public SupplierDTO find(String id) throws Exception {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new CustomException("supplier not found"));
        return modelMapper.map(supplier, SupplierDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return supplierRepository.existsById(id);
    }
}
