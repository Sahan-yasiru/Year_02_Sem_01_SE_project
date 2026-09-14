package org.com.application_backend.service.impl.order;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.InventoryDTO;
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
import org.com.application_backend.service.custom.InventoryService;
import org.com.application_backend.service.custom.order.OrderService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@RequiredArgsConstructor
@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryRepository;
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
    public OrderDTO internalSave(OrderDTO dto) throws Exception {

        Customer customer = requireCustomer(dto.getCustomer());
        List<SparePart> parts = resolveParts(dto.getSpareParts());
        reserveStock(parts);

        dto.setCustomer(customer);
        dto.setSpareParts(parts);
        dto.setQuantity(parts.size());
        dto.setTotalPrice(parts.stream().mapToDouble(SparePart::getSellPrice).sum());
        dto.setDate(new Date());
        dto.setOrderStatus(dto.getOrderStatus() == null ? OrderStatus.CONFIRMED : dto.getOrderStatus());
        if (dto.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new CustomException("a new order must start as CONFIRMED");
        }
        return modelMapper.map(orderRepository.save(modelMapper.map(dto,Order.class)), OrderDTO.class);
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
            Customer customer = requireCustomer(dto.getCustomer());
            existing.setCustomer(customer);
        }
        if (dto.getSpareParts() != null && !dto.getSpareParts().isEmpty()) {
            List<SparePart> parts = resolveParts(dto.getSpareParts());
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

    private void releaseStock(List<SparePart> parts) throws Exception {
        adjustStock(parts, 1, "");
    }


    private void adjustStock(List<SparePart> parts, int direction, String insufficientStockMessage) throws Exception {
        for (SparePart sparePart : parts) {
            if (sparePart.getInventory() == null ||
                    isBlank(sparePart.getInventory().getInventory_id())) {
                throw new CustomException(
                        "inventory is not configured for spare part: "
                                + sparePart.getPartID()
                );
            }
            Inventory inventory = modelMapper.map(inventoryRepository.find(sparePart.getInventory().getInventory_id()), Inventory.class);
            inventory.setQuantity_on_hand(inventory.getQuantity_on_hand() + direction);
            inventoryRepository.save(modelMapper.map(inventory, InventoryDTO.class));

        }

    }


    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
