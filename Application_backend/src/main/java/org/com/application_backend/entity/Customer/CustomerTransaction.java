package org.com.application_backend.entity.Customer;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.order.Order;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class CustomerTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int saleID;

    @Column(nullable = false)
    private Date date;

    private double amount;

    @OneToOne
    @JoinColumn(nullable = false,name = "orderID")
    private Order order;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

}
