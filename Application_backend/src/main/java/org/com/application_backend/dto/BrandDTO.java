package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class BrandDTO {
    private String brandID;
    private String brandName;
    private String countryOfOrigin;
}
