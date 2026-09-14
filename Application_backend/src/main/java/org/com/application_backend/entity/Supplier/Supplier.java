package org.com.application_backend.entity.Supplier;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Supplier {
    @Id
    private String SupplierID;
    private String name;

    @Column(unique = true)
    private int phone;

    @Column(unique = true)
    private String email;

}
