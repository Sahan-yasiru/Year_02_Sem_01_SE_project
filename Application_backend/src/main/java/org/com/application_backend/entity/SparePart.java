package org.com.application_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.Supplier.Supplier;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class SparePart {

    @Id
    private String partID;


    @ManyToMany
    @JoinTable(
            name = "spare_part_supplier",
            joinColumns = @JoinColumn(name = "part_id"),
            inverseJoinColumns = @JoinColumn(name = "supplier_id")
    )
    private List<Supplier> suppliers;
;

    @OneToOne
    @JoinColumn(name = "brandID")
    private Brand brand;

    @OneToOne
    @JoinColumn(name = "categoryID")
    private Category category;

    @OneToOne
    @JoinColumn(name = "inventoryID")
    private Inventory inventory;

    private String partNum;
    private String partName;
    private double costPrice;
    private double sellPrice;

}
