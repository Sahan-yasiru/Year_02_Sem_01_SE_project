package org.com.application_backend.repo.purchase;

import org.com.application_backend.entity.purchase.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
    @Query("SELECT po.purchaseOrderId FROM PurchaseOrder po ORDER BY po.purchaseOrderId DESC")
    List<String> getLastPurchaseOrderId();
}
