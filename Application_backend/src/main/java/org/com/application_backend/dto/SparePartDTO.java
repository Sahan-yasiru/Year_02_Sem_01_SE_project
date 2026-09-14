package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.Brand;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.entity.Category;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class SparePartDTO {
    private String partID;
    private Supplier supplier;
    private Brand brand;
    private Category category;
    private Inventory inventory;
    private String partNum;
    private String partName;
    private double costPrice;
    private double sellPrice;
}
