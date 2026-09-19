package com.collegecontest.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class ReadReplicaRoutingDataSource extends AbstractRoutingDataSource {
    public static final String PRIMARY = "primary";
    public static final String REPLICA = "replica";

    private final DbRoutingProperties properties;

    public ReadReplicaRoutingDataSource(DbRoutingProperties properties) {
        this.properties = properties;
    }

    @Override
    protected Object determineCurrentLookupKey() {
        if (!properties.isEnabled()) {
            return PRIMARY;
        }

        boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
        boolean readOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
        if (readOnly && (!properties.isReadOnlyTransactionsOnly() || txActive)) {
            return REPLICA;
        }

        return PRIMARY;
    }
}
