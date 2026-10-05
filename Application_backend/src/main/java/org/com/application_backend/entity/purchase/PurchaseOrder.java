package org.com.application_backend.entity.purchase;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.Supplier.Supplier;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "purchase_order")
public class PurchaseOrder {

    @Id
    private String purchaseOrderId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Supplier supplier;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date orderDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date expectedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseOrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseOrderPaymentStatus paymentStatus;

    private double totalAmount;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @Column(length = 1000)
    private String notes;
}
