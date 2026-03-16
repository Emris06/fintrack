package com.fintrack.repository;

import com.fintrack.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUserIdAndIsActiveTrue(Long userId);

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    /**
     * Returns the sum of balances for a user, grouped by currency.
     * Each result row is an Object[] where [0] = currency (String), [1] = total balance (BigDecimal).
     */
    @Query("SELECT a.currency, SUM(a.balance) FROM Account a " +
           "WHERE a.user.id = :userId AND a.isActive = true " +
           "GROUP BY a.currency")
    List<Object[]> sumBalancesByUserIdGroupedByCurrency(@Param("userId") Long userId);
}
