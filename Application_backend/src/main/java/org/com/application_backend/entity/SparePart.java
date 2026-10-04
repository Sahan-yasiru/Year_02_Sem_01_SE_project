package org.com.application_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.com.application_backend.entity.Supplier.Supplier;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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

    @ManyToOne
    @JoinColumn(name = "brandID")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Brand brand;

    @ManyToOne
    @JoinColumn(name = "categoryID")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Category category;

    private String partName;
    private double costPrice;
    private double sellPrice;

}
