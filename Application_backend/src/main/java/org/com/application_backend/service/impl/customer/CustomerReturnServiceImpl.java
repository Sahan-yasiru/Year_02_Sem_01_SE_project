package org.com.application_backend.service.impl.customer;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerReturnDTO;
import org.com.application_backend.entity.Customer.CustomerReturn;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.entity.order.OrderStatus;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Customer.CustomerReturnRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.customer.CustomerReturnService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Service
public class CustomerReturnServiceImpl implements CustomerReturnService {

    private final CustomerReturnRepository customerReturnRepository;
    private final OrderRepository orderRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public CustomerReturnDTO save(CustomerReturnDTO dto) throws Exception {

        if (dto == null) {
            throw new CustomException("Return details cannot be null");
        }

        if (dto.getReturnID() == null || dto.getReturnID().trim().isEmpty()) {
            dto.setReturnID("RET-" + System.currentTimeMillis() % 100000);
        }

        if (dto.getDate() == null) {
            dto.setDate(new Date());
        }

        Order order = cusReturnVerify(dto, true);

        CustomerReturn returnEntity = modelMapper.map(dto, CustomerReturn.class);

        returnEntity.setOrder(order);

        customerReturnRepository.save(returnEntity);

        return dto;
    }

    @Transactional
    public Order cusReturnVerify(CustomerReturnDTO dto, boolean withID) throws Exception {

        if (dto == null) {
            throw new CustomException("Return details cannot be null");
        }

        if (withID && dto.getReturnID() != null && ifExit(dto.getReturnID())) {

            throw new CustomException("Customer return already exists with ID: " + dto.getReturnID());
        }

        if (dto.getOrder() == null || dto.getOrder().getOrderId() == null || dto.getOrder().getOrderId().trim().isEmpty()) {

            throw new CustomException("Order ID is required");
        }

        Order order = orderRepository.findById(dto.getOrder().getOrderId()).orElseThrow(() -> new CustomException("Order does not exist"));

        if (withID && order.getOrderStatus() == OrderStatus.CANCELLED) {

            throw new CustomException("Cannot process return for a cancelled order");
        }

        if (withID) {
            order.setOrderStatus(OrderStatus.RETURNED);
        }

        return order;
    }

    @Override
    @Transactional
    public CustomerReturnDTO update(CustomerReturnDTO dto) throws Exception {

        if (dto == null) {
            throw new CustomException("Return details cannot be null");
        }

        if (dto.getReturnID() == null || dto.getReturnID().trim().isEmpty()) {

            throw new CustomException("Return ID is required");
        }

        if (!ifExit(dto.getReturnID())) {
            throw new CustomException("Customer return not found with ID: " + dto.getReturnID());
        }

        if (dto.getDate() == null) {
            dto.setDate(new Date());
        }

        Order order = cusReturnVerify(dto, false);

        CustomerReturn returnEntity = modelMapper.map(dto, CustomerReturn.class);

        returnEntity.setOrder(order);

        customerReturnRepository.save(returnEntity);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerReturnDTO> getAll() throws Exception {

        return customerReturnRepository.findAll().stream().map(customerReturn -> modelMapper.map(customerReturn, CustomerReturnDTO.class)).toList();
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {

        if (!ifExit(id)) {
            throw new CustomException("Customer return not found with ID: " + id);
        }

        customerReturnRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerReturnDTO find(String id) throws Exception {

        return customerReturnRepository.findById(id).map(customerReturn -> modelMapper.map(customerReturn, CustomerReturnDTO.class)).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {

        return customerReturnRepository.existsById(id);
    }
}