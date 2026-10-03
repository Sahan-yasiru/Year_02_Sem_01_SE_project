package org.com.application_backend;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.BrandDTO;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.dto.Customer.CustomerDTO;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.user.UserRepository;
import org.com.application_backend.service.custom.CategoryService;
import org.com.application_backend.service.custom.SparePartService;
import org.com.application_backend.service.custom.UserService;
import org.com.application_backend.service.custom.customer.CustomerService;
import org.com.application_backend.service.custom.supplier.SupplierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class ApplicationBackendApplicationTests {
    @Autowired
    SparePartService sparePartService;
    @Autowired
    SupplierService supplierService;
    @Test
    void contextLoads() throws Exception {
        SparePartDTO sparePartDTO = new SparePartDTO();
        sparePartDTO.setPartID("PART006");
        CategoryDTO categoryDTO = new CategoryDTO();
        categoryDTO.setCategoryId(4);

        sparePartDTO.setCategory(categoryDTO);
        BrandDTO brandDTO = new BrandDTO();
        brandDTO.setBrandID("BR002");
        sparePartDTO.setBrand(brandDTO);

        sparePartDTO.setSuppliers(supplierService.getAll());
        sparePartDTO.setSellPrice(1000);
        sparePartDTO.setCostPrice(1000);


        System.out.println(sparePartService.save(sparePartDTO));;
    }

}
