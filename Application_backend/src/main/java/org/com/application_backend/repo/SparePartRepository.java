package org.com.application_backend.repo;

import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.Supplier.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, String> {

    @Query("SELECT sp FROM SparePart sp WHERE :supplier MEMBER OF sp.suppliers")
    List<SparePart> findBySuppliers(@Param("supplier") Supplier supplier);}

