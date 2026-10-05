package org.com.application_backend.service.custom.purchase;

import org.com.application_backend.dto.purchase.PurchaseOrderDTO;
import org.com.application_backend.dto.purchase.ReceiveItemDTO;
import org.com.application_backend.entity.purchase.PurchaseOrderPaymentStatus;
import org.com.application_backend.service.SuperService;

import java.util.List;

public interface PurchaseOrderService extends SuperService<PurchaseOrderDTO> {
    PurchaseOrderDTO receiveGoods(String poId, List<ReceiveItemDTO> receiveItems) throws Exception;
    PurchaseOrderDTO updatePaymentStatus(String poId, PurchaseOrderPaymentStatus paymentStatus) throws Exception;
    String getLastId() throws Exception;
}
