package org.com.application_backend.entity.order;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class OrderItem {
    @Id
    private String id;

    @OneToMany
    private List<SparePart> spareParts;

    private int quantity;

    private double totalPrice;


    @OneToOne
    @JoinColumn(name = "customerID")
    private Customer customer;

}
