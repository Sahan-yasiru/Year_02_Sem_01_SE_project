package org.com.application_backend.service.impl.purchase;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.dto.purchase.PurchaseOrderDTO;
import org.com.application_backend.dto.purchase.PurchaseOrderItemDTO;
import org.com.application_backend.dto.purchase.ReceiveItemDTO;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.entity.purchase.PurchaseOrder;
import org.com.application_backend.entity.purchase.PurchaseOrderItem;
import org.com.application_backend.entity.purchase.PurchaseOrderPaymentStatus;
import org.com.application_backend.entity.purchase.PurchaseOrderStatus;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.InventoryRepository;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.repo.Supplier.SupplierRepository;
import org.com.application_backend.repo.purchase.PurchaseOrderItemRepository;
import org.com.application_backend.repo.purchase.PurchaseOrderRepository;
import org.com.application_backend.service.custom.purchase.PurchaseOrderService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final SparePartRepository sparePartRepository;
    private final InventoryRepository inventoryRepository;
    private final ModelMapper modelMapper;

    @Override
    public String getLastId() throws Exception {
        List<String> lastIds = purchaseOrderRepository.getLastPurchaseOrderId();
        if (lastIds != null && !lastIds.isEmpty()) {
            String lastId = lastIds.get(0);
            try {
                int num = Integer.parseInt(lastId.replaceAll("\\D", ""));
                return String.format("PO%03d", num + 1);
            } catch (Exception ignored) {
            }
        }
        return "PO001";
    }

    @Override
    @Transactional
    public PurchaseOrderDTO save(PurchaseOrderDTO dto) throws Exception {
        if (dto.getPurchaseOrderId() == null || dto.getPurchaseOrderId().trim().isEmpty()) {
            dto.setPurchaseOrderId(getLastId());
        }

        if (ifExit(dto.getPurchaseOrderId())) {
            throw new CustomException("Purchase Order " + dto.getPurchaseOrderId() + " already exists");
        }

        if (dto.getSupplier() == null || dto.getSupplier().getSupplierID() == null) {
            throw new CustomException("Supplier is required for Purchase Order");
        }

        Supplier supplier = supplierRepository.findById(dto.getSupplier().getSupplierID())
                .orElseThrow(() -> new CustomException("Supplier not found: " + dto.getSupplier().getSupplierID()));

        PurchaseOrder po = new PurchaseOrder();
        po.setPurchaseOrderId(dto.getPurchaseOrderId().trim());
        po.setSupplier(supplier);
        po.setOrderDate(dto.getOrderDate() != null ? dto.getOrderDate() : new Date());
        po.setExpectedDate(dto.getExpectedDate());
        po.setStatus(dto.getStatus() != null ? dto.getStatus() : PurchaseOrderStatus.PENDING);
        po.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : PurchaseOrderPaymentStatus.PENDING);
        po.setNotes(dto.getNotes());

        double total = 0.0;
        List<PurchaseOrderItem> items = new ArrayList<>();

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (PurchaseOrderItemDTO itemDTO : dto.getItems()) {
                String partId = itemDTO.getPartId() != null ? itemDTO.getPartId() :
                        (itemDTO.getSparePart() != null ? itemDTO.getSparePart().getPartID() : null);

                if (partId == null) {
                    throw new CustomException("Spare part is required for order item");
                }

                SparePart part = sparePartRepository.findById(partId)
                        .orElseThrow(() -> new CustomException("Spare part not found: " + partId));

                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(po);
                item.setSparePart(part);
                item.setOrderedQuantity(itemDTO.getOrderedQuantity());
                item.setReceivedQuantity(0);

                double price = itemDTO.getUnitPrice() > 0 ? itemDTO.getUnitPrice() : part.getCostPrice();
                item.setUnitPrice(price);
                double lineTotal = price * itemDTO.getOrderedQuantity();
                item.setLineTotal(lineTotal);

                total += lineTotal;
                items.add(item);
            }
        }

        po.setTotalAmount(total);
        po.setItems(items);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderDTO update(PurchaseOrderDTO dto) throws Exception {
        PurchaseOrder po = purchaseOrderRepository.findById(dto.getPurchaseOrderId())
                .orElseThrow(() -> new CustomException("Purchase Order not found: " + dto.getPurchaseOrderId()));

        if (dto.getSupplier() != null && dto.getSupplier().getSupplierID() != null) {
            Supplier supplier = supplierRepository.findById(dto.getSupplier().getSupplierID())
                    .orElseThrow(() -> new CustomException("Supplier not found"));
            po.setSupplier(supplier);
        }

        if (dto.getExpectedDate() != null) {
            po.setExpectedDate(dto.getExpectedDate());
        }
        if (dto.getNotes() != null) {
            po.setNotes(dto.getNotes());
        }
        if (dto.getPaymentStatus() != null) {
            po.setPaymentStatus(dto.getPaymentStatus());
        }

        // If items are submitted and PO has not yet started receiving goods, allow updating items
        if (po.getStatus() == PurchaseOrderStatus.PENDING && dto.getItems() != null && !dto.getItems().isEmpty()) {
            po.getItems().clear();
            double total = 0.0;
            for (PurchaseOrderItemDTO itemDTO : dto.getItems()) {
                String partId = itemDTO.getPartId() != null ? itemDTO.getPartId() :
                        (itemDTO.getSparePart() != null ? itemDTO.getSparePart().getPartID() : null);

                SparePart part = sparePartRepository.findById(partId)
                        .orElseThrow(() -> new CustomException("Spare part not found: " + partId));

                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(po);
                item.setSparePart(part);
                item.setOrderedQuantity(itemDTO.getOrderedQuantity());
                item.setReceivedQuantity(0);

                double price = itemDTO.getUnitPrice() > 0 ? itemDTO.getUnitPrice() : part.getCostPrice();
                item.setUnitPrice(price);
                double lineTotal = price * itemDTO.getOrderedQuantity();
                item.setLineTotal(lineTotal);

                total += lineTotal;
                po.getItems().add(item);
            }
            po.setTotalAmount(total);
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return toDTO(updated);
    }

    @Override
    @Transactional
    public PurchaseOrderDTO receiveGoods(String poId, List<ReceiveItemDTO> receiveItems) throws Exception {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new CustomException("Purchase Order not found: " + poId));

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new CustomException("Cannot receive goods on a cancelled purchase order");
        }

        if (receiveItems == null || receiveItems.isEmpty()) {
            throw new CustomException("No receive items specified");
        }

        for (ReceiveItemDTO rItem : receiveItems) {
            PurchaseOrderItem targetItem = null;

            for (PurchaseOrderItem item : po.getItems()) {
                if (rItem.getItemId() != null && item.getId() != null && item.getId().equals(rItem.getItemId())) {
                    targetItem = item;
                    break;
                }
                if (rItem.getPartId() != null && item.getSparePart() != null &&
                        item.getSparePart().getPartID().equals(rItem.getPartId())) {
                    targetItem = item;
                    break;
                }
            }

            if (targetItem != null && rItem.getReceivedQuantity() > 0) {
                int incoming = rItem.getReceivedQuantity();
                int currentReceived = targetItem.getReceivedQuantity();
                int newReceived = currentReceived + incoming;

                if (newReceived > targetItem.getOrderedQuantity()) {
                    newReceived = targetItem.getOrderedQuantity();
                    incoming = newReceived - currentReceived;
                }

                if (incoming > 0) {
                    targetItem.setReceivedQuantity(newReceived);

                    // Increase existing inventory quantity on hand
                    SparePart part = targetItem.getSparePart();
                    Inventory inventory = inventoryRepository.getInventoryByPart(part);
                    if (inventory != null) {
                        inventory.setQuantity_on_hand(inventory.getQuantity_on_hand() + incoming);
                        inventoryRepository.save(inventory);
                    } else {
                        // Create initial inventory tracking if not present
                        String invId = "INV" + String.format("%03d", System.currentTimeMillis() % 100000);
                        Inventory newInv = new Inventory(invId, part, incoming, 5, null);
                        inventoryRepository.save(newInv);
                    }
                }
            }
        }

        // Re-evaluate PO status
        boolean allComplete = true;
        boolean anyReceived = false;

        for (PurchaseOrderItem item : po.getItems()) {
            if (item.getReceivedQuantity() < item.getOrderedQuantity()) {
                allComplete = false;
            }
            if (item.getReceivedQuantity() > 0) {
                anyReceived = true;
            }
        }

        if (allComplete) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else if (anyReceived) {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.PENDING);
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toDTO(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderDTO updatePaymentStatus(String poId, PurchaseOrderPaymentStatus paymentStatus) throws Exception {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new CustomException("Purchase Order not found: " + poId));

        po.setPaymentStatus(paymentStatus);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderDTO> getAll() throws Exception {
        List<PurchaseOrderDTO> dtos = new ArrayList<>();
        purchaseOrderRepository.findAll().forEach(po -> dtos.add(toDTO(po)));
        return dtos;
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new CustomException("Purchase Order not found: " + id));
        purchaseOrderRepository.delete(po);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderDTO find(String id) throws Exception {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new CustomException("Purchase Order not found: " + id));
        return toDTO(po);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {
        return purchaseOrderRepository.existsById(id);
    }

    private PurchaseOrderDTO toDTO(PurchaseOrder po) {
        PurchaseOrderDTO dto = new PurchaseOrderDTO();
        dto.setPurchaseOrderId(po.getPurchaseOrderId());
        dto.setOrderDate(po.getOrderDate());
        dto.setExpectedDate(po.getExpectedDate());
        dto.setStatus(po.getStatus());
        dto.setPaymentStatus(po.getPaymentStatus());
        dto.setTotalAmount(po.getTotalAmount());
        dto.setNotes(po.getNotes());

        if (po.getSupplier() != null) {
            dto.setSupplier(modelMapper.map(po.getSupplier(), SupplierDTO.class));
        }

        List<PurchaseOrderItemDTO> itemDTOs = new ArrayList<>();
        if (po.getItems() != null) {
            for (PurchaseOrderItem item : po.getItems()) {
                PurchaseOrderItemDTO itemDTO = new PurchaseOrderItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setOrderedQuantity(item.getOrderedQuantity());
                itemDTO.setReceivedQuantity(item.getReceivedQuantity());
                itemDTO.setUnitPrice(item.getUnitPrice());
                itemDTO.setLineTotal(item.getLineTotal());

                if (item.getSparePart() != null) {
                    itemDTO.setPartId(item.getSparePart().getPartID());
                    itemDTO.setPartName(item.getSparePart().getPartName());
                    itemDTO.setSparePart(modelMapper.map(item.getSparePart(), SparePartDTO.class));
                }
                itemDTOs.add(itemDTO);
            }
        }
        dto.setItems(itemDTOs);

        return dto;
    }
}
