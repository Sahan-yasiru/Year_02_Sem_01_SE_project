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
@Entity
public class Order {

    @Id
    private String orderId;

    @OneToOne
    @JoinColumn(name = "customerID")
    private Customer customer;

    @OneToMany
    private List<SparePart> spareParts;

    private int quantity;

    private double totalPrice;

    @Column(nullable = false)
    private Date date;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    private String address;



}
