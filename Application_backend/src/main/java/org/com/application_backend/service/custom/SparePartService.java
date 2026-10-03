package org.com.application_backend.service.custom;

import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.service.SuperService;

public interface SparePartService extends SuperService<SparePartDTO> {
    SparePartDTO save(SparePartDTO sparePartDTO,boolean state) throws Exception;
}
