package org.com.application_backend.dto.Supplier;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class SupplierTransactionDTO {
    private Long id;
    private Supplier supplier;
    private Date date;
    private double price;
    private SparePart sparePart;
}
