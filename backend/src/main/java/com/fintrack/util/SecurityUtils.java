package com.fintrack.util;

import com.fintrack.security.SecurityUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class; prevent instantiation
    }

    public static Long getCurrentUserId() {
        SecurityUser securityUser = getSecurityUser();
        return securityUser.getUserId();
    }

    public static String getCurrentEmail() {
        SecurityUser securityUser = getSecurityUser();
        return securityUser.getEmail();
    }

    private static SecurityUser getSecurityUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found in security context");
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof SecurityUser)) {
            throw new IllegalStateException(
                    "Unexpected principal type: " + principal.getClass().getName());
        }
        return (SecurityUser) principal;
    }
}
