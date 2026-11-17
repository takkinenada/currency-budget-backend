package com.example.budget.service;

/** Для заданого бюджету й брендів не вдалося скласти жодної сумісної збірки. */
public class NoBuildPossibleException extends RuntimeException {

    public NoBuildPossibleException(String message) {
        super(message);
    }
}
