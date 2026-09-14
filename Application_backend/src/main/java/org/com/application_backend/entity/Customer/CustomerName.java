package org.com.application_backend.entity.Customer;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Embeddable
public class CustomerName {

    @Column(nullable = false)
    private String fistName;

    @Column(nullable = false)
    private String lastName;
}
