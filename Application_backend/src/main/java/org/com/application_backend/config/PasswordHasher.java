package org.com.application_backend.config;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordHasher {
    public static String getHashPassword(String password) {
        int logRounds = 10;
        String salt = BCrypt.gensalt(logRounds);
        return BCrypt.hashpw(password, salt);
    }

    public static boolean checkPassword(String password, String storedHash) {
        return BCrypt.checkpw(password, storedHash);
    }
}
