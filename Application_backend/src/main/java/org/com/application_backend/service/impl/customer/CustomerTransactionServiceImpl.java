package org.com.application_backend.service.impl.customer;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerTransactionDTO;
import org.com.application_backend.entity.Customer.CustomerTransaction;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Customer.CustomerTransactionRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.customer.CustomerTransactionService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Service
public class CustomerTransactionServiceImpl implements CustomerTransactionService {

    private final CustomerTransactionRepository customerTransactionRepository;
    private final OrderRepository orderRepository;
    private final ModelMapper modelMapper;

    /**
     * Persist a new transaction.
     * Validates that the referenced order exists and defaults the date to now if absent.
     */
    @Override
    @Transactional
    public CustomerTransactionDTO save(CustomerTransactionDTO dto) throws Exception {
        if (dto == null) {
            throw new CustomException("Transaction details cannot be null");
        }
        if (dto.getOrder() == null || dto.getOrder().getOrderId() == null) {
            throw new CustomException("Order ID is required for a customer transaction");
        }
        orderRepository.findById(dto.getOrder().getOrderId())
                .orElseThrow(() -> new CustomException(
                        "Order not found: " + dto.getOrder().getOrderId()));

        if (dto.getDate() == null) {
            dto.setDate(new Date());
        }
        if (dto.getAmount() < 0) {
            throw new CustomException("Transaction amount cannot be negative");
        }

        CustomerTransaction entity = modelMapper.map(dto, CustomerTransaction.class);
        CustomerTransaction saved = customerTransactionRepository.save(entity);
        return modelMapper.map(saved, CustomerTransactionDTO.class);
    }

    /**
     * Update an existing transaction identified by saleID.
     */
    @Override
    @Transactional
    public CustomerTransactionDTO update(CustomerTransactionDTO dto) throws Exception {
        if (dto == null) {
            throw new CustomException("Transaction details cannot be null");
        }
        if (!ifExit(String.valueOf(dto.getSaleID()))) {
            throw new CustomException("Customer transaction not found with ID: " + dto.getSaleID());
        }
        if (dto.getOrder() == null || dto.getOrder().getOrderId() == null) {
            throw new CustomException("Order ID is required for a customer transaction");
        }
        orderRepository.findById(dto.getOrder().getOrderId())
                .orElseThrow(() -> new CustomException(
                        "Order not found: " + dto.getOrder().getOrderId()));

        if (dto.getDate() == null) {
            dto.setDate(new Date());
        }
        if (dto.getAmount() < 0) {
            throw new CustomException("Transaction amount cannot be negative");
        }

        CustomerTransaction entity = modelMapper.map(dto, CustomerTransaction.class);
        CustomerTransaction saved = customerTransactionRepository.save(entity);
        return modelMapper.map(saved, CustomerTransactionDTO.class);
    }

    /** Return all transactions mapped to DTOs. */
    @Override
    public List<CustomerTransactionDTO> getAll() throws Exception {
        return customerTransactionRepository.findAll().stream()
                .map(t -> modelMapper.map(t, CustomerTransactionDTO.class))
                .toList();
    }

    /** Delete a transaction by its saleID (passed as a String from the controller). */
    @Override
    @Transactional
    public void delete(String id) throws Exception {
        int saleId = parseId(id);
        if (!customerTransactionRepository.existsById(saleId)) {
            throw new CustomException("Customer transaction not found with ID: " + id);
        }
        customerTransactionRepository.deleteById(saleId);
    }

    /** Find a single transaction by saleID. */
    @Override
    public CustomerTransactionDTO find(String id) throws Exception {
        int saleId = parseId(id);
        return customerTransactionRepository.findById(saleId)
                .map(t -> modelMapper.map(t, CustomerTransactionDTO.class))
                .orElseThrow(() -> new CustomException(
                        "Customer transaction not found with ID: " + id));
    }

    /** Check whether a transaction with the given saleID exists. */
    @Override
    public boolean ifExit(String id) throws Exception {
        try {
            return customerTransactionRepository.existsById(parseId(id));
        } catch (CustomException e) {
            return false;
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private int parseId(String id) throws CustomException {
        try {
            return Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new CustomException("Invalid customer transaction ID: " + id);
        }
    }
}
