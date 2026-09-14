package org.com.application_backend.service.impl.supplier;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierTransactionDTO;
import org.com.application_backend.entity.Supplier.SupplierTransaction;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Supplier.SupplierTransactionRepository;
import org.com.application_backend.service.custom.supplier.SupplierTransactionService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class SupplierTransactionServiceImpl implements SupplierTransactionService {

    private final SupplierTransactionRepository supplierTransactionRepository;
    private final ModelMapper modelMapper;

    @Override
    public SupplierTransactionDTO save(SupplierTransactionDTO dto) throws Exception {
        return modelMapper.map(
                supplierTransactionRepository.save(modelMapper.map(dto, SupplierTransaction.class)),
                SupplierTransactionDTO.class
        );
    }

    @Override
    public SupplierTransactionDTO update(SupplierTransactionDTO dto) throws Exception {
        if (dto.getId() == null || !ifExit(String.valueOf(dto.getId()))) {
            throw new CustomException("supplier transaction not found");
        }
        return modelMapper.map(
                supplierTransactionRepository.save(modelMapper.map(dto, SupplierTransaction.class)),
                SupplierTransactionDTO.class
        );
    }

    @Override
    public List<SupplierTransactionDTO> getAll() throws Exception {
        List<SupplierTransactionDTO> dtos = new ArrayList<>();
        supplierTransactionRepository.findAll().forEach(transaction -> {
            dtos.add(modelMapper.map(transaction, SupplierTransactionDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        supplierTransactionRepository.deleteById(parseId(id));
    }

    @Override
    public SupplierTransactionDTO find(String id) throws Exception {
        SupplierTransaction transaction = supplierTransactionRepository.findById(parseId(id))
                .orElseThrow(() -> new CustomException("supplier transaction not found"));
        return modelMapper.map(transaction, SupplierTransactionDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return supplierTransactionRepository.existsById(parseId(id));
    }

    private Long parseId(String id) throws CustomException {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new CustomException("invalid supplier transaction id");
        }
    }
}
