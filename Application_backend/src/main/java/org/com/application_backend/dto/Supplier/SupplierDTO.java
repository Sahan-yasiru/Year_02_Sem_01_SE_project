package org.com.application_backend.dto.Supplier;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class SupplierDTO {
    private String SupplierID;
    private String name;
    private int phone;
    private String email;
    private List<SparePart> spareParts;
}
