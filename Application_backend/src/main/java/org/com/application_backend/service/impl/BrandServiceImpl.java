package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.BrandDTO;
import org.com.application_backend.entity.Brand;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.BrandRepository;
import org.com.application_backend.service.custom.BrandService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ModelMapper modelMapper;

    @Override
    public BrandDTO save(BrandDTO dto) throws Exception {
        if (ifExit(dto.getBrandID())) {
            throw new CustomException("brand already registered");
        }
        return modelMapper.map(brandRepository.save(modelMapper.map(dto, Brand.class)), BrandDTO.class);
    }

    @Override
    public BrandDTO update(BrandDTO dto) throws Exception {
        if (!ifExit(dto.getBrandID())) {
            throw new CustomException("brand not found");
        }
        return modelMapper.map(brandRepository.save(modelMapper.map(dto, Brand.class)), BrandDTO.class);
    }

    @Override
    public List<BrandDTO> getAll() throws Exception {
        List<BrandDTO> dtos = new ArrayList<>();
        brandRepository.findAll().forEach(brand -> {
            dtos.add(modelMapper.map(brand, BrandDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        brandRepository.deleteById(id);
    }

    @Override
    public BrandDTO find(String id) throws Exception {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new CustomException("brand not found"));
        return modelMapper.map(brand, BrandDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return brandRepository.existsById(id);
    }
}
