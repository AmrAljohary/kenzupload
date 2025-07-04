import { create } from "zustand";
import { NotificationType } from "../components/ui/Notification";

export interface NotificationState {
    visible: boolean;
    type: NotificationType;
    mainText: string;
    subText?: string;
    duration?: number;
    autoClose?: boolean;

    showNotification: (params: {
        type: NotificationType;
        mainText: string;
        subText?: string;
        duration?: number;
        autoClose?: boolean;
    }) => void;
    hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    visible: false,
    type: "info",
    mainText: "",
    subText: "",
    duration: 3000,
    autoClose: true,

    showNotification: ({
        type,
        mainText,
        subText,
        duration = 3000,
        autoClose = true,
    }) => {
        set({
            visible: true,
            type,
            mainText,
            subText,
            duration,
            autoClose,
        });
    },

    hideNotification: () => {
        set({
            visible: false,
        });
    },
}));
