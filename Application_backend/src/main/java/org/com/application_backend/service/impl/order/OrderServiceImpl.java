package org.com.application_backend.service.impl.order;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.entity.order.OrderStatus;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.InventoryRepository;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.order.OrderService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final SparePartRepository sparePartRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public OrderDTO save(OrderDTO dto) throws Exception {
        if (dto == null || isBlank(dto.getOrderId())) {
            throw new CustomException("order id is required");
        }
        if (orderRepository.existsById(dto.getOrderId())) {
            throw new CustomException("order already exists");
        }

        return internalSave(dto);

    }
    @Transactional
    public OrderDTO internalSave(OrderDTO dto) throws Exception {

        Customer customer = requireCustomer(
                modelMapper.map(dto.getCustomer(), Customer.class)
        );

        List<SparePart> parts = resolveParts(
                dto.getSpareParts().stream()
                        .map(spDto -> modelMapper.map(spDto, SparePart.class))
                        .collect(Collectors.toList())
        );

        reserveStock(parts);

        Order order = new Order();

        order.setOrderId(dto.getOrderId());
        order.setCustomer(customer);
        order.setSpareParts(parts);
        order.setQuantity(parts.size());
        order.setTotalPrice(
                parts.stream()
                        .mapToDouble(SparePart::getSellPrice)
                        .sum()
        );
        order.setDate(new Date());
        order.setOrderStatus(
                dto.getOrderStatus() == null
                        ? OrderStatus.CONFIRMED
                        : dto.getOrderStatus()
        );
        order.setAddress(dto.getAddress());

        Order savedOrder = orderRepository.save(order);

        return modelMapper.map(savedOrder, OrderDTO.class);
    }
    @Override
    @Transactional
    public OrderDTO update(OrderDTO dto) throws Exception {
        if (dto == null || isBlank(dto.getOrderId())) {
            throw new CustomException("order id is required");
        }
        Order existing = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new CustomException("order not found"));

        if (dto.getCustomer() != null && !isBlank(dto.getCustomer().getCustomerID())) {
            Customer customer = requireCustomer(modelMapper.map(dto.getCustomer(), Customer.class));
            existing.setCustomer(customer);
        }
        if (dto.getSpareParts() != null && !dto.getSpareParts().isEmpty()) {
            List<SparePart> parts = resolveParts(
                    dto.getSpareParts().stream()
                            .map(spDto -> modelMapper.map(spDto, SparePart.class))
                            .collect(Collectors.toList())
            );
            existing.setSpareParts(parts);
        }
        if (dto.getQuantity() > 0) {
            existing.setQuantity(dto.getQuantity());
        }
        if (dto.getTotalPrice() > 0) {
            existing.setTotalPrice(dto.getTotalPrice());
        }
        if (dto.getOrderStatus() != null) {
            existing.setOrderStatus(dto.getOrderStatus());
        }
        if (dto.getAddress() != null) {
            existing.setAddress(dto.getAddress());
        }

        return modelMapper.map(orderRepository.save(existing), OrderDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getAll() throws Exception {
        List<OrderDTO> orders = new ArrayList<>();
        orderRepository.findAll().forEach(order -> {
            orders.add(modelMapper.map(order, OrderDTO.class));
        });
        return orders;
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new CustomException("order not found"));
        if (order.getOrderStatus() != OrderStatus.CANCELLED) {
            throw new CustomException("only cancelled orders may be deleted");
        }
        releaseStock(order.getSpareParts());
        orderRepository.delete(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO find(String id) throws Exception {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new CustomException("order not found"));

        return modelMapper.map(order, OrderDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {
        return orderRepository.existsById(id);
    }

    private Customer requireCustomer(Customer requestedCustomer) {
        if (requestedCustomer == null || isBlank(requestedCustomer.getCustomerID())) {
            throw new CustomException("customer is required");
        }
        return customerRepository.findById(requestedCustomer.getCustomerID())
                .orElseThrow(() -> new CustomException("customer not found"));
    }

    private List<SparePart> resolveParts(List<SparePart> requestedParts) {
        if (requestedParts == null || requestedParts.isEmpty()) {
            throw new CustomException("an order must contain at least one spare part");
        }
        List<SparePart> parts = new ArrayList<>();
        for (SparePart requestedPart : requestedParts) {
            if (requestedPart == null || isBlank(requestedPart.getPartID())) {
                throw new CustomException("every order item must identify a spare part");
            }
            parts.add(sparePartRepository.findById(requestedPart.getPartID())
                    .orElseThrow(() -> new CustomException("spare part not found: " + requestedPart.getPartID())));
        }
        return parts;
    }

    private void reserveStock(List<SparePart> parts) throws Exception {
        adjustStock(parts, -1, "insufficient stock for spare part: ");
    }

    @Override
    public void releaseStock(List<SparePart> parts) throws Exception {
        adjustStock(parts, 1, "");
    }

    protected void adjustStock(List<SparePart> parts, int direction, String insufficientStockMessage) throws Exception {
        for (SparePart sparePart : parts) {

            if (inventoryRepository.getInventoryByPart(sparePart) == null) {
                throw new CustomException(
                        "inventory is not configured for spare part: "
                                + sparePart.getPartID()
                );
            }
            Inventory inventory = modelMapper.map(inventoryRepository.getInventoryByPart(sparePart), Inventory.class);
            inventory.setQuantity_on_hand(inventory.getQuantity_on_hand() + direction);
            inventoryRepository.save(inventory);

        }

    }


    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
