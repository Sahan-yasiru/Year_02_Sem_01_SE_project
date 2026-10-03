package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.entity.Brand;
import org.com.application_backend.entity.Inventory;
import org.com.application_backend.entity.Supplier.Supplier;
import org.com.application_backend.entity.Category;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
public class SparePartDTO {
    private String partID;
    private String partName;
    private List<SupplierDTO> suppliers;
    private BrandDTO brand;
    private CategoryDTO category;
    private double costPrice;
    private double sellPrice;
}
