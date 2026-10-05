package org.com.application_backend.service.custom;

import org.com.application_backend.dto.SparePart.SparePartDTO;
import org.com.application_backend.service.SuperService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SparePartService extends SuperService<SparePartDTO> {
    SparePartDTO save(SparePartDTO sparePartDTO, boolean state) throws Exception;

    SparePartDTO save(SparePartDTO sparePartDTO, MultipartFile img, boolean state) throws Exception;

    @Transactional
    SparePartDTO update(SparePartDTO dto, MultipartFile img) throws Exception;

    List<SparePartDTO> getBySupplier(String supplierID) throws Exception;
}
