package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class BrandDTO {
    private String brandID;
    private String brandName;
    private String countryOfOrigin;
}
