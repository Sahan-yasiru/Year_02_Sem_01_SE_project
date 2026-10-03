package org.com.application_backend.entity.Customer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.entity.user.User;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Customer {
    @Id
    private String customerID;
    @Embedded
    private  CustomerName name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private int phoneNumber;

    @Column(nullable = false)
    private String address;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private User user;


}
