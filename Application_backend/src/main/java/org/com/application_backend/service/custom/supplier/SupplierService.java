package org.com.application_backend.service.custom.supplier;

import org.com.application_backend.dto.SparePart.SparePartDTO;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.service.SuperService;

import java.util.List;

public interface SupplierService extends SuperService<SupplierDTO> {
    void updateSuppliedSpareParts(String supplierID, List<String> partIDs) throws Exception;
    List<SparePartDTO> getSuppliedSpareParts(String supplierID) throws Exception;
}

