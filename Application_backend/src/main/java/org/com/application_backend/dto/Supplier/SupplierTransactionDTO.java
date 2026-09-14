package org.com.application_backend.dto.Supplier;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SupplierTransactionDTO {
    private Long id;
    private Supplier supplier;
    private Date date;
    private double price;
    private SparePart sparePart;
}
