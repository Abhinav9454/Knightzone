package com.collegecontest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.db-routing")
public class DbRoutingProperties {
    /**
     * Enable read-replica routing in production.
     */
    private boolean enabled = false;

    /**
     * Route to replica only when a read-only transaction is active.
     */
    private boolean readOnlyTransactionsOnly = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isReadOnlyTransactionsOnly() {
        return readOnlyTransactionsOnly;
    }

    public void setReadOnlyTransactionsOnly(boolean readOnlyTransactionsOnly) {
        this.readOnlyTransactionsOnly = readOnlyTransactionsOnly;
    }
}
