package com.collegecontest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "websocket.broker")
public class WebSocketBrokerProperties {
    private boolean relayEnabled = false;
    private String relayHost = "localhost";
    private int relayPort = 61613;
    private String clientLogin = "guest";
    private String clientPasscode = "guest";
    private String systemLogin = "guest";
    private String systemPasscode = "guest";
    private String virtualHost = "/";
    private List<String> destinationPrefixes = new ArrayList<>(List.of("/topic", "/queue"));
    private long simpleHeartbeatSendMs = 10_000L;
    private long simpleHeartbeatReceiveMs = 10_000L;
    private long relaySystemHeartbeatSendMs = 10_000L;
    private long relaySystemHeartbeatReceiveMs = 10_000L;

    public boolean isRelayEnabled() {
        return relayEnabled;
    }

    public void setRelayEnabled(boolean relayEnabled) {
        this.relayEnabled = relayEnabled;
    }

    public String getRelayHost() {
        return relayHost;
    }

    public void setRelayHost(String relayHost) {
        this.relayHost = relayHost;
    }

    public int getRelayPort() {
        return relayPort;
    }

    public void setRelayPort(int relayPort) {
        this.relayPort = relayPort;
    }

    public String getClientLogin() {
        return clientLogin;
    }

    public void setClientLogin(String clientLogin) {
        this.clientLogin = clientLogin;
    }

    public String getClientPasscode() {
        return clientPasscode;
    }

    public void setClientPasscode(String clientPasscode) {
        this.clientPasscode = clientPasscode;
    }

    public String getSystemLogin() {
        return systemLogin;
    }

    public void setSystemLogin(String systemLogin) {
        this.systemLogin = systemLogin;
    }

    public String getSystemPasscode() {
        return systemPasscode;
    }

    public void setSystemPasscode(String systemPasscode) {
        this.systemPasscode = systemPasscode;
    }

    public String getVirtualHost() {
        return virtualHost;
    }

    public void setVirtualHost(String virtualHost) {
        this.virtualHost = virtualHost;
    }

    public List<String> getDestinationPrefixes() {
        return destinationPrefixes;
    }

    public void setDestinationPrefixes(List<String> destinationPrefixes) {
        this.destinationPrefixes = destinationPrefixes;
    }

    public long getSimpleHeartbeatSendMs() {
        return simpleHeartbeatSendMs;
    }

    public void setSimpleHeartbeatSendMs(long simpleHeartbeatSendMs) {
        this.simpleHeartbeatSendMs = simpleHeartbeatSendMs;
    }

    public long getSimpleHeartbeatReceiveMs() {
        return simpleHeartbeatReceiveMs;
    }

    public void setSimpleHeartbeatReceiveMs(long simpleHeartbeatReceiveMs) {
        this.simpleHeartbeatReceiveMs = simpleHeartbeatReceiveMs;
    }

    public long getRelaySystemHeartbeatSendMs() {
        return relaySystemHeartbeatSendMs;
    }

    public void setRelaySystemHeartbeatSendMs(long relaySystemHeartbeatSendMs) {
        this.relaySystemHeartbeatSendMs = relaySystemHeartbeatSendMs;
    }

    public long getRelaySystemHeartbeatReceiveMs() {
        return relaySystemHeartbeatReceiveMs;
    }

    public void setRelaySystemHeartbeatReceiveMs(long relaySystemHeartbeatReceiveMs) {
        this.relaySystemHeartbeatReceiveMs = relaySystemHeartbeatReceiveMs;
    }
}
