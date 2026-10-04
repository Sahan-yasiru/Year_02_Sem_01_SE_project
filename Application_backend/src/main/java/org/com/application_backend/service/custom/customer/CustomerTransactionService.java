package org.com.application_backend.service.custom.customer;

import org.com.application_backend.dto.Customer.CustomerTransactionDTO;
import org.com.application_backend.service.SuperService;

/**
 * CustomerTransactionService — business-logic contract for customer sale transactions.
 * Extends the generic SuperService parameterised with CustomerTransactionDTO so all
 * standard CRUD operations (save, update, getAll, find, delete, ifExit) are inherited.
 */
public interface CustomerTransactionService extends SuperService<CustomerTransactionDTO> {
}
