package org.com.application_backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Brand {
    @Id
    private String brandID;
    private String brandName;
    private String countryOfOrigin;

}
