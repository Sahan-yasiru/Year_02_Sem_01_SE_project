package org.com.application_backend.entity.Supplier;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.sparepart.SparePart;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class SupplierTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "supplierID")
    private Supplier supplier;

    private Date date;
    private double price;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "sparePartID")
    private List<SparePart> spareParts;
}
