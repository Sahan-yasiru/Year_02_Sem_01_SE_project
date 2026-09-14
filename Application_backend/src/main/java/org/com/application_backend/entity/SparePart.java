package org.com.application_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.Supplier.Supplier;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class SparePart {

    @Id
    private String partID;

    @ManyToOne(cascade = CascadeType.ALL)
    private Supplier supplier;

    @OneToOne
    @JoinColumn(name = "brandID")
    private Brand brand;

    @OneToOne
    @JoinColumn(name = "categoryID")
    private category category;

    @OneToOne
    @JoinColumn(name = "inventoryID")
    private Inventory inventory;

    private String partNum;
    private String partName;
    private double costPrice;
    private double sellPrice;

}
