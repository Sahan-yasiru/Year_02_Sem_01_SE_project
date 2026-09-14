package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.service.custom.SparePartService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class SparePartServiceImpl implements SparePartService {

    private final SparePartRepository sparePartRepository;
    private final ModelMapper modelMapper;

    @Override
    public SparePartDTO save(SparePartDTO dto) throws Exception {
        if (ifExit(dto.getPartID())) {
            throw new CustomException("spare part already registered");
        }
        return modelMapper.map(sparePartRepository.save(modelMapper.map(dto, SparePart.class)), SparePartDTO.class);
    }

    @Override
    public SparePartDTO update(SparePartDTO dto) throws Exception {
        if (!ifExit(dto.getPartID())) {
            throw new CustomException("spare part not found");
        }
        return modelMapper.map(sparePartRepository.save(modelMapper.map(dto, SparePart.class)), SparePartDTO.class);
    }

    @Override
    public List<SparePartDTO> getAll() throws Exception {
        List<SparePartDTO> dtos = new ArrayList<>();
        sparePartRepository.findAll().forEach(sparePart -> {
            dtos.add(modelMapper.map(sparePart, SparePartDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        sparePartRepository.deleteById(id);
    }

    @Override
    public SparePartDTO find(String id) throws Exception {
        SparePart sparePart = sparePartRepository.findById(id)
                .orElseThrow(() -> new CustomException("spare part not found"));
        return modelMapper.map(sparePart, SparePartDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return sparePartRepository.existsById(id);
    }
}
