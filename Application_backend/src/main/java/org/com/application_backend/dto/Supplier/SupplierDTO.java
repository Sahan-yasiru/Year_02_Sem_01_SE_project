package org.com.application_backend.dto.Supplier;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@ToString
@Data
public class SupplierDTO {

    @JsonProperty("supplierID")
    @JsonAlias({"SupplierID", "supplierID"})
    private String supplierID;

    private String name;
    private Integer phone;

    @NotBlank
    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$",
            message = "Invalid email address"
    )
    private String email;

}
