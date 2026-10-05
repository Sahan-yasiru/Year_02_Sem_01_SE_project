package org.com.application_backend.dto.Supplier;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class SupplierTransactionDTO {
    private Long id;
    private SupplierDTO supplier;
    private Date date;
    private double price;
    private SparePartDTO sparePart;
}
