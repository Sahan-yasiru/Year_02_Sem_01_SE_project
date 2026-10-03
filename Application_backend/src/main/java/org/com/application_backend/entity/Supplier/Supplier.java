package org.com.application_backend.entity.Supplier;

import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Supplier {
    @Id
    private String supplierID;
    private String name;

    @Column(unique = true)
    private int phone;

    @Column(unique = true)
    private String email;

}
