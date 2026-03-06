"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for browser-style navigation history management.
 * Tracks section navigation with back/forward support.
 */
export function useNavigation() {
    const [activeSection, setActiveSection] = useState("home");
    const [activeTab, setActiveTab] = useState("profile");
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

    const navigateToSection = useCallback((section, addToHistory = true) => {
        setActiveSection(section);

        // Set default active tab based on the section
        switch (section) {
            case "experience":
                setActiveTab("experience");
                break;
            case "about":
                setActiveTab("profile");
                break;
            case "projects":
                setActiveTab("all");
                break;
            case "skills":
            case "blog":
            case "contact":
            case "home":
                break;
            default:
                break;
        }

        if (addToHistory) {
            setNavigationHistory(prev => {
                const newHistory = [...prev.slice(0, currentHistoryIndex + 1), section];
                setCurrentHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        }
    }, [currentHistoryIndex]);

    const goBack = useCallback(() => {
        if (currentHistoryIndex > 0) {
            const newIndex = currentHistoryIndex - 1;
            setCurrentHistoryIndex(newIndex);
            setNavigationHistory(prev => {
                navigateToSection(prev[newIndex], false);
                return prev;
            });
        }
    }, [currentHistoryIndex, navigateToSection]);

    const goForward = useCallback(() => {
        setNavigationHistory(prev => {
            if (currentHistoryIndex < prev.length - 1) {
                const newIndex = currentHistoryIndex + 1;
                setCurrentHistoryIndex(newIndex);
                navigateToSection(prev[newIndex], false);
            }
            return prev;
        });
    }, [currentHistoryIndex, navigateToSection]);

    const initializeHistory = useCallback(() => {
        setNavigationHistory(["home"]);
        setCurrentHistoryIndex(0);
    }, []);

    return {
        activeSection,
        activeTab,
        setActiveTab,
        navigationHistory,
        currentHistoryIndex,
        navigateToSection,
        goBack,
        goForward,
        initializeHistory,
    };
}
