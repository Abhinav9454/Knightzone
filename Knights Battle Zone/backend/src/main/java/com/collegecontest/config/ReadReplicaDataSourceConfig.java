package com.collegecontest.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@Profile("prod")
@EnableConfigurationProperties(DbRoutingProperties.class)
public class ReadReplicaDataSourceConfig {

    @Bean(name = "primaryDataSourceProperties")
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "readReplicaDataSourceProperties")
    @ConfigurationProperties("spring.datasource-read")
    @ConditionalOnProperty(prefix = "spring.datasource-read", name = "enabled", havingValue = "true")
    public DataSourceProperties readReplicaDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "primaryDataSource")
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource primaryDataSource(
            @Qualifier("primaryDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean(name = "readReplicaDataSource")
    @ConfigurationProperties("spring.datasource-read.hikari")
    @ConditionalOnProperty(prefix = "spring.datasource-read", name = "enabled", havingValue = "true")
    public HikariDataSource readReplicaDataSource(
            @Qualifier("readReplicaDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean
    @Primary
    public DataSource dataSource(
            DbRoutingProperties routingProperties,
            @Qualifier("primaryDataSource") DataSource primaryDataSource,
            @Qualifier("readReplicaDataSource") ObjectProvider<DataSource> readReplicaDataSourceProvider) {
        DataSource readReplicaDataSource = readReplicaDataSourceProvider.getIfAvailable();
        if (!routingProperties.isEnabled() || readReplicaDataSource == null) {
            return new LazyConnectionDataSourceProxy(primaryDataSource);
        }

        ReadReplicaRoutingDataSource routingDataSource = new ReadReplicaRoutingDataSource(routingProperties);
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(ReadReplicaRoutingDataSource.PRIMARY, primaryDataSource);
        targetDataSources.put(ReadReplicaRoutingDataSource.REPLICA, readReplicaDataSource);
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        routingDataSource.afterPropertiesSet();

        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}
