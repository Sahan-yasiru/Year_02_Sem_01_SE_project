package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Brand;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.entity.category;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SparePartDTO {
    private String partID;
    private Supplier supplier;
    private Brand brand;
    private category category;
    private Inventory inventory;
    private String partNum;
    private String partName;
    private double costPrice;
    private double sellPrice;
}
