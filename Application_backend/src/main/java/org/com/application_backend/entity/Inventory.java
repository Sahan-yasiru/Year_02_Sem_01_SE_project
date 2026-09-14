package org.com.application_backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Inventory {
    @Id
    private String inventory_id;
    @OneToOne
    @JoinColumn(name = "sparepartID")
    private SparePart part;
    private int quantity_on_hand;

    //This tells the system when it is time to order more stock.
    private int reorder_threshold;
}
