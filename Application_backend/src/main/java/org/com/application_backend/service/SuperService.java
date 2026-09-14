package org.com.application_backend.service;

import java.util.List;

public interface SuperService<T> {
    T  save(T dto) throws Exception;

    T update(T dto)throws Exception;

    List<T> getAll()throws Exception;

    void delete(String id)throws Exception;

    T find(String id)throws Exception;

    boolean ifExit(String id)throws Exception;



}
