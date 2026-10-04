package org.com.application_backend.service.custom;

import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.service.SuperService;

import java.util.List;

public interface SparePartService extends SuperService<SparePartDTO> {
    SparePartDTO save(SparePartDTO sparePartDTO,boolean state) throws Exception;
    List<SparePartDTO> getBySupplier(String supplierID) throws Exception;
}
