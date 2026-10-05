package org.com.application_backend.service.custom.order;

import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.sparepart.SparePart;
import org.com.application_backend.service.SuperService;

import java.util.List;

public interface OrderService extends SuperService<OrderDTO> {
    void releaseStock(List<SparePart> parts) throws Exception;
}
