package org.com.application_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.engine.internal.Cascade;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Inventory {
    @Id
    private String inventory_id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "sparepartID")
    private SparePart part;

    private int quantity_on_hand;

    //This tells the system when it is time to order more stock.
    private int reorder_threshold;

    /* Detects stale stock updates in paths that do not take the pessimistic lock. */
    @Version
    private Long version;


}
