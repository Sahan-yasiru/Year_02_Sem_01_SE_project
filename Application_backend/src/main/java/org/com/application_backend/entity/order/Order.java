package org.com.application_backend.entity.order;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity(name = "customer_order")
public class Order {

    @Id
    private String orderId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customerID")
    private Customer customer;

    // A catalogue part can appear in many different orders.  The join table is
    // intentionally not cascaded: orders never create or delete catalogue data.
    @ManyToMany
    @JoinTable(name = "customer_order_spare_part",
            joinColumns = @JoinColumn(name = "order_id"),
            inverseJoinColumns = @JoinColumn(name = "part_id"))
    private List<SparePart> spareParts;

    private int quantity;

    private double totalPrice;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus;

    private String address;



}
