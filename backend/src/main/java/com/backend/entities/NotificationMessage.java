package com.backend.entities;

public class NotificationMessage {

    private String receiver;
    private String message;

    public NotificationMessage() {}

    public NotificationMessage(String receiver, String message) {
        this.receiver = receiver;
        this.message = message;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
