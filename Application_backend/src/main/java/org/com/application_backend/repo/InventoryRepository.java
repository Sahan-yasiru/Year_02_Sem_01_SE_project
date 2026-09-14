package org.com.application_backend.repo;

import org.com.application_backend.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {
    /** Locks a stock row while an order reserves or releases it. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i where i.inventory_id = :inventoryId")
    Optional<Inventory> findWithLockByInventory_id(@Param("inventoryId") String inventoryId);
}
