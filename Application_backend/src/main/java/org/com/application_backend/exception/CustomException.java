package org.com.application_backend.exception;

public class CustomException extends RuntimeException{
    public CustomException(String massege){
        super(massege);
    }
}
