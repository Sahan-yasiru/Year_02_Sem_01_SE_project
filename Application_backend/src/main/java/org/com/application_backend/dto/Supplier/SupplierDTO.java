package org.com.application_backend.dto.Supplier;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SupplierDTO {
    private String SupplierID;
    private String name;
    private int phone;
    private String email;
    private List<SparePart> spareParts;
}
